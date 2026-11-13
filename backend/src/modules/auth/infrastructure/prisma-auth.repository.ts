import { Injectable } from '@nestjs/common';
import { Prisma, type User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  AuthRepository,
  CreateAuthUserResult,
  RotateAuthSessionInput,
  RotateAuthSessionResult,
} from '../domain/auth.repository';
import { NewAuthSession } from '../domain/auth-session';
import { AuthUser } from '../domain/auth-user';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toAuthUser(user) : null;
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    role: 'PUBLIC_USER';
    privacyAcceptedAt: Date;
    privacyNoticeVersion: string;
  }): Promise<CreateAuthUserResult> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          privacyAcceptedAt: input.privacyAcceptedAt,
          privacyNoticeVersion: input.privacyNoticeVersion,
        },
      });
      return { kind: 'created', user: this.toAuthUser(user) };
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        return { kind: 'duplicate' };
      }
      throw error;
    }
  }

  // Returns false if the user is not ACTIVE (race with disable).
  // Throws on unexpected DB errors (including P2002 on tokenHash, which is
  // practically impossible with crypto-random UUIDs and indicates a bug).
  async createRefreshSession(session: NewAuthSession): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const users = await transaction.$queryRaw<{ status: string }[]>`
        SELECT "status"
        FROM "User"
        WHERE "id" = ${session.userId}::uuid
        FOR UPDATE
      `;
      if (users[0]?.status !== 'ACTIVE') {
        return false;
      }

      await transaction.refreshSession.create({
        data: {
          id: session.id,
          userId: session.userId,
          familyId: session.familyId,
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
        },
      });
      return true;
    });
  }

  async rotateRefreshSession(
    input: RotateAuthSessionInput,
  ): Promise<RotateAuthSessionResult> {
    const discoveredSession = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: input.tokenHash },
      select: { userId: true },
    });
    if (!discoveredSession) {
      return { kind: 'not-found' };
    }

    return this.prisma.$transaction(async (transaction) => {
      // Lock user: serializa por usuario y evita que se deshabilite mid-rotation.
      const users = await transaction.$queryRaw<{ status: string }[]>`
      SELECT "status"
      FROM "User"
      WHERE "id" = ${discoveredSession.userId}::uuid
      FOR UPDATE
    `;
      const user = users[0];

      // Lock session: excluye rotaciones concurrentes del mismo token.
      const sessions = await transaction.$queryRaw<
        {
          id: string;
          userId: string;
          familyId: string;
          tokenHash: string;
          expiresAt: Date;
          revokedAt: Date | null;
        }[]
      >`
      SELECT "id", "userId", "familyId", "tokenHash", "expiresAt", "revokedAt"
      FROM "RefreshSession"
      WHERE "tokenHash" = ${input.tokenHash}
      FOR UPDATE
    `;
      const session = sessions[0];
      if (!session) {
        return { kind: 'not-found' };
      }

      // Replay detection (fuente de verdad: BD, no el catch).
      if (session.revokedAt) {
        await this.revokeFamily(
          transaction,
          session.familyId,
          input.consumedAt,
        );
        return { kind: 'replayed' };
      }

      // Integridad de la fila.
      if (!user || session.userId !== discoveredSession.userId) {
        return { kind: 'not-found' };
      }

      // CAS contra las claims firmadas del JWT.
      //    Si esto falla, es bug interno o ataque teórico.
      if (
        session.id !== input.expectedSessionId ||
        session.userId !== input.expectedUserId ||
        session.familyId !== input.expectedFamilyId
      ) {
        throw new Error(
          `Session/claim mismatch for tokenHash ${input.tokenHash}`,
        );
      }

      // User activo.
      if (user.status !== 'ACTIVE') {
        await this.revokeFamily(
          transaction,
          session.familyId,
          input.consumedAt,
        );
        return { kind: 'revoked' };
      }

      // Expiración.
      if (session.expiresAt <= input.consumedAt) {
        return { kind: 'expired' };
      }

      // Consumir la sesión (CAS).
      const consumed = await transaction.refreshSession.updateMany({
        where: {
          id: session.id,
          tokenHash: input.tokenHash,
          userId: session.userId,
          familyId: session.familyId,
          revokedAt: null,
          expiresAt: { gt: input.consumedAt },
        },
        data: { revokedAt: input.consumedAt },
      });
      if (consumed.count !== 1) {
        // Código muerto con FOR UPDATE: si llega aquí, es bug. 500 interno, no "replayed".
        throw new Error(
          `CAS failed rotating session ${session.id} (count=${consumed.count})`,
        );
      }

      // Integridad de la cadena: la nueva sesión debe pertenecer a la misma familia.
      if (input.nextSession.familyId !== session.familyId) {
        throw new Error(
          `nextSession.familyId (${input.nextSession.familyId}) != session.familyId (${session.familyId})`,
        );
      }

      // Insertar el siguiente eslabón.
      await transaction.refreshSession.create({
        data: {
          id: input.nextSession.id,
          userId: session.userId,
          familyId: session.familyId,
          tokenHash: input.nextSession.tokenHash,
          expiresAt: input.nextSession.expiresAt,
        },
      });

      return { kind: 'rotated' };
    });
  }

  async revokeRefreshSessionFamily(
    familyId: string,
    revokedAt: Date,
  ): Promise<void> {
    const session = await this.prisma.refreshSession.findFirst({
      where: { familyId },
      select: { userId: true },
    });

    if (!session) return;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT "id" FROM "User" WHERE "id" = ${session.userId}::uuid FOR UPDATE
      `;

      await transaction.refreshSession.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt },
      });
    });
  }

  private async revokeFamily(
    transaction: Prisma.TransactionClient,
    familyId: string,
    revokedAt: Date,
  ): Promise<void> {
    await transaction.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt },
    });
  }

  private toAuthUser(user: PrismaUser): AuthUser {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
    };
  }

  private isPrismaError(
    error: unknown,
    code: string,
  ): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === code
    );
  }
}
