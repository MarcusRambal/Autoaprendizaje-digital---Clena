import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { User, UserRepository, UserStatus } from '../domain/user.repository';
import {
  UserStatusChangeResult,
  UserStatusRepository,
} from '../domain/user-status.repository';

@Injectable()
export class PrismaUserRepository
  implements UserRepository, UserStatusRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUser(user) : null;
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
