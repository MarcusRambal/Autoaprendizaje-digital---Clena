import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ChangeHelpRequestStatusUseCase } from './application/change-help-request-status.use-case';
import { CreateHelpRequestUseCase } from './application/create-help-request.use-case';
import { DeleteHelpRequestUseCase } from './application/delete-help-request.use-case';
import { GetHelpRequestUseCase } from './application/get-help-request.use-case';
import { ListHelpRequestsUseCase } from './application/list-help-requests.use-case';
import { ListMyHelpRequestsUseCase } from './application/list-my-help-requests.use-case';
import type { HelpRequestRepository } from './domain/help-request.repository';
import { PrismaHelpRequestRepository } from './infrastructure/prisma-help-request.repository';
import { HelpRequestsController } from './presentation/help-requests.controller';

const HELP_REQUEST_REPOSITORY = Symbol('HELP_REQUEST_REPOSITORY');

const useCase = <T>(UseCase: new (repository: HelpRequestRepository) => T) => ({
  provide: UseCase,
  inject: [HELP_REQUEST_REPOSITORY],
  useFactory: (repository: HelpRequestRepository) => new UseCase(repository),
});

@Module({
  // JwtModule is needed because AccessTokenGuard is built in this module.
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [HelpRequestsController],
  providers: [
    PrismaHelpRequestRepository,
    {
      provide: HELP_REQUEST_REPOSITORY,
      useExisting: PrismaHelpRequestRepository,
    },
    useCase(CreateHelpRequestUseCase),
    useCase(ListHelpRequestsUseCase),
    useCase(ListMyHelpRequestsUseCase),
    useCase(GetHelpRequestUseCase),
    useCase(ChangeHelpRequestStatusUseCase),
    useCase(DeleteHelpRequestUseCase),
  ],
})
export class HelpRequestsModule {}
