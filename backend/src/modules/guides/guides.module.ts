import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CreateGuideUseCase } from './application/create-guide.use-case';
import { DeleteGuideUseCase } from './application/delete-guide.use-case';
import { GetGuideFileUseCase } from './application/get-guide-file.use-case';
import { GetGuideUseCase } from './application/get-guide.use-case';
import { ListGuidesUseCase } from './application/list-guides.use-case';
import { UpdateGuideUseCase } from './application/update-guide.use-case';
import type { GuideRepository } from './domain/guide.repository';
import { PrismaGuideRepository } from './infrastructure/prisma-guide.repository';
import { GuidesController } from './presentation/guides.controller';

const GUIDE_REPOSITORY = Symbol('GUIDE_REPOSITORY');

const useCase = <T>(UseCase: new (repository: GuideRepository) => T) => ({
  provide: UseCase,
  inject: [GUIDE_REPOSITORY],
  useFactory: (repository: GuideRepository) => new UseCase(repository),
});

@Module({
  // JwtModule is needed because AccessTokenGuard is built in this module.
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [GuidesController],
  providers: [
    PrismaGuideRepository,
    { provide: GUIDE_REPOSITORY, useExisting: PrismaGuideRepository },
    useCase(CreateGuideUseCase),
    useCase(ListGuidesUseCase),
    useCase(GetGuideUseCase),
    useCase(GetGuideFileUseCase),
    useCase(UpdateGuideUseCase),
    useCase(DeleteGuideUseCase),
  ],
})
export class GuidesModule {}
