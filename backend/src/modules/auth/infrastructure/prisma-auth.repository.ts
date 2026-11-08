import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
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
  }): Promise<CreateAuthUserResult> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: this.normalizeEmail(input.email),
          passwordHash: input.passwordHash,
          role: input.role,
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

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const users = await transaction.$queryRaw<{ status: string }[]>`
            SELECT "status"
            FROM "User"
            WHERE "id" = ${discoveredSession.userId}::uuid
            FOR UPDATE
          `;
          const user = users[0];
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

          if (session.revokedAt) {
            await this.revokeFamily(
              transaction,
              session.familyId,
              input.consumedAt,
            );
            return { kind: 'replayed' };
          }
          if (!user || session.userId !== discoveredSession.userId) {
            return { kind: 'not-found' };
          }
          if (
            session.id !== input.expectedSessionId ||
            session.userId !== input.expectedUserId ||
            session.familyId !== input.expectedFamilyId
          ) {
            return { kind: 'not-found' };
          }
          if (user.status !== 'ACTIVE') {
            await this.revokeFamily(
              transaction,
              session.familyId,
              input.consumedAt,
            );
            return { kind: 'revoked' };
          }
          if (session.expiresAt <= input.consumedAt) {
            return { kind: 'expired' };
          }

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
            await this.revokeFamily(
              transaction,
              session.familyId,
              input.consumedAt,
            );
            return { kind: 'replayed' };
          }

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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (this.isSerializationFailure(error)) {
        await this.revokeRefreshSessionFamily(
          input.expectedFamilyId,
          input.consumedAt,
        );
        return { kind: 'replayed' };
      }
      throw error;
    }
  }

  async revokeRefreshSessionFamily(
    familyId: string,
    revokedAt: Date,
  ): Promise<void> {
    const session = await this.prisma.refreshSession.findFirst({
      where: { familyId },
      select: { userId: true },
    });
    if (!session) {
      return;
    }

    await this.prisma.$transaction(async (transaction) => {
      const users = await transaction.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "User"
        WHERE "id" = ${session.userId}::uuid
        FOR UPDATE
      `;
      if (!users[0]) {
        return;
      }

      await transaction.refreshSession.updateMany({
        where: { userId: session.userId, familyId, revokedAt: null },
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

  private toAuthUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    status: string;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as AuthUser['role'],
      status: user.status as AuthUser['status'],
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
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

  private isSerializationFailure(error: unknown): boolean {
    if (this.isPrismaError(error, 'P2034')) {
      return true;
    }
    if (!this.isPrismaError(error, 'P2010') || !('meta' in error)) {
      return false;
    }

    const meta = error.meta;
    return (
      typeof meta === 'object' &&
      meta !== null &&
      'code' in meta &&
      meta.code === '40001'
    );
  }
}
