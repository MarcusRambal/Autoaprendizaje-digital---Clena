import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../shared/database/database.module';
import { CompleteLessonProgressUseCase } from './application/complete-lesson-progress.use-case';
import { GetMyProgressUseCase } from './application/get-my-progress.use-case';
import { TrackGuideProgressUseCase } from './application/track-guide-progress.use-case';
import { ProgressRepository } from './domain/progress.repository';
import { PrismaProgressRepository } from './infrastructure/prisma-progress.repository';
import { ProgressController } from './presentation/progress.controller';

const PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');

const useCase = <T>(UseCase: new (repository: ProgressRepository) => T) => ({
  provide: UseCase,
  inject: [PROGRESS_REPOSITORY],
  useFactory: (repository: ProgressRepository) => new UseCase(repository),
});

@Module({
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [ProgressController],
  providers: [
    PrismaProgressRepository,
    { provide: PROGRESS_REPOSITORY, useExisting: PrismaProgressRepository },
    useCase(GetMyProgressUseCase),
    useCase(TrackGuideProgressUseCase),
    useCase(CompleteLessonProgressUseCase),
  ],
})
export class ProgressModule {}
