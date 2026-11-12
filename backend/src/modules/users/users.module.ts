import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CredentialHasher } from '../auth/domain/credential-hasher.port';
import { CREDENTIAL_HASHER } from '../auth/infrastructure/prisma-auth.module';
import { CreateUserUseCase } from './application/create-user.use-case';
import { DeleteUserAccountUseCase } from './application/delete-user-account.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import type { UserAccountRepository } from './domain/user-account.repository';
import type { UserListRepository } from './domain/user-list.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './presentation/users.controller';

const USER_ACCOUNT_REPOSITORY = Symbol('USER_ACCOUNT_REPOSITORY');
const USER_LIST_REPOSITORY = Symbol('USER_LIST_REPOSITORY');
const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Module({
  // JwtModule is needed because AccessTokenGuard is built in this module.
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [
    PrismaUserRepository,
    { provide: USER_REPOSITORY, useExisting: PrismaUserRepository },
    { provide: USER_ACCOUNT_REPOSITORY, useExisting: PrismaUserRepository },
    { provide: USER_LIST_REPOSITORY, useExisting: PrismaUserRepository },
    {
      provide: ListUsersUseCase,
      inject: [USER_LIST_REPOSITORY],
      useFactory: (repository: UserListRepository) =>
        new ListUsersUseCase(repository),
    },
    {
      provide: DeleteUserAccountUseCase,
      inject: [USER_ACCOUNT_REPOSITORY],
      useFactory: (repository: UserAccountRepository) =>
        new DeleteUserAccountUseCase(repository),
    },
    {
      provide: CreateUserUseCase,
      inject: [USER_REPOSITORY, CREDENTIAL_HASHER],
      useFactory: (
        repository: UserAccountRepository,
        credentialHasher: CredentialHasher,
      ) => new CreateUserUseCase(repository, credentialHasher),
    },
  ],
})
export class UsersModule {}
