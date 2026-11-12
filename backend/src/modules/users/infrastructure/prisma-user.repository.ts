import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/database/prisma.service';
import { User, UserRepository, UserStatus } from '../domain/user.repository';
import {
  DeleteAccountResult,
  UserAccountRepository,
} from '../domain/user-account.repository';
import {
  ListUsersQuery,
  UserListRepository,
  UserPage,
} from '../domain/user-list.repository';
import {
  UserStatusChangeResult,
  UserStatusRepository,
} from '../domain/user-status.repository';

@Injectable()
export class PrismaUserRepository
  implements
    UserRepository,
    UserStatusRepository,
    UserAccountRepository,
    UserListRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUser(user) : null;
  }

  async list(query: ListUsersQuery): Promise<UserPage> {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? { email: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        // Explicit select: the password hash must never leave the repository.
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ email: query.order }, { id: query.order }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        status: row.status,
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
    changedAt: Date,
  ): Promise<UserStatusChangeResult> {
    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
          where: { id: userId },
          data: { status },
        });

        if (status !== 'ACTIVE') {
          await transaction.refreshSession.updateMany({
            where: { userId, revokedAt: null, expiresAt: { gt: changedAt } },
            data: { revokedAt: changedAt },
          });
        }

        return updated;
      });

      return { kind: 'updated', user: this.toUser(user) };
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<DeleteAccountResult> {
    try {
      await this.prisma.$transaction([
        // Requests made by the user are personal data: erase them too.
        // Sessions and learning progress are removed by ON DELETE CASCADE.
        this.prisma.helpRequest.deleteMany({ where: { requesterId: userId } }),
        this.prisma.user.delete({ where: { id: userId } }),
      ]);
      return { kind: 'deleted' };
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      throw error;
    }
  }

  private toUser(user: {
    id: string;
    email: string;
    role: string;
    status: string;
  }): User {
    return {
      id: user.id,
      email: user.email,
      role: user.role as User['role'],
      status: user.status as UserStatus,
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
