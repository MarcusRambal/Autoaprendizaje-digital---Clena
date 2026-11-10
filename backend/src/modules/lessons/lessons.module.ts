import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CreateLessonUseCase } from './application/create-lesson.use-case';
import { DeleteLessonUseCase } from './application/delete-lesson.use-case';
import { ListLessonsUseCase } from './application/list-lessons.use-case';
import { UpdateLessonUseCase } from './application/update-lesson.use-case';
import type { LessonRepository } from './domain/lesson.repository';
import { PrismaLessonRepository } from './infrastructure/prisma-lesson.repository';
import { LessonsController } from './presentation/lessons.controller';

const LESSON_REPOSITORY = Symbol('LESSON_REPOSITORY');

const useCase = <T>(UseCase: new (repository: LessonRepository) => T) => ({
  provide: UseCase,
  inject: [LESSON_REPOSITORY],
  useFactory: (repository: LessonRepository) => new UseCase(repository),
});

@Module({
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [LessonsController],
  providers: [
    PrismaLessonRepository,
    { provide: LESSON_REPOSITORY, useExisting: PrismaLessonRepository },
    useCase(CreateLessonUseCase),
    useCase(ListLessonsUseCase),
    useCase(UpdateLessonUseCase),
    useCase(DeleteLessonUseCase),
  ],
})
export class LessonsModule {}
