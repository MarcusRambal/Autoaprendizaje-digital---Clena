import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { DeleteUserAccountUseCase } from './application/delete-user-account.use-case';
import type { UserAccountRepository } from './domain/user-account.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './presentation/users.controller';

const USER_ACCOUNT_REPOSITORY = Symbol('USER_ACCOUNT_REPOSITORY');

@Module({
  // JwtModule is needed because AccessTokenGuard is built in this module.
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [
    PrismaUserRepository,
    { provide: USER_ACCOUNT_REPOSITORY, useExisting: PrismaUserRepository },
    {
      provide: DeleteUserAccountUseCase,
      inject: [USER_ACCOUNT_REPOSITORY],
      useFactory: (repository: UserAccountRepository) =>
        new DeleteUserAccountUseCase(repository),
    },
  ],
})
export class UsersModule {}
