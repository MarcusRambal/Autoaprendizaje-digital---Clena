import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CreateCategoryUseCase } from './application/create-category.use-case';
import { DeleteCategoryUseCase } from './application/delete-category.use-case';
import { ListCategoriesUseCase } from './application/list-categories.use-case';
import { RenameCategoryUseCase } from './application/rename-category.use-case';
import type { CategoryRepository } from './domain/category.repository';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { CategoriesController } from './presentation/categories.controller';

const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

@Module({
  // JwtModule is needed because AccessTokenGuard is built in this module.
  imports: [AuthModule, DatabaseModule, JwtModule.register({})],
  controllers: [CategoriesController],
  providers: [
    PrismaCategoryRepository,
    { provide: CATEGORY_REPOSITORY, useExisting: PrismaCategoryRepository },
    {
      provide: CreateCategoryUseCase,
      inject: [CATEGORY_REPOSITORY],
      useFactory: (repository: CategoryRepository) =>
        new CreateCategoryUseCase(repository),
    },
    {
      provide: ListCategoriesUseCase,
      inject: [CATEGORY_REPOSITORY],
      useFactory: (repository: CategoryRepository) =>
        new ListCategoriesUseCase(repository),
    },
    {
      provide: RenameCategoryUseCase,
      inject: [CATEGORY_REPOSITORY],
      useFactory: (repository: CategoryRepository) =>
        new RenameCategoryUseCase(repository),
    },
    {
      provide: DeleteCategoryUseCase,
      inject: [CATEGORY_REPOSITORY],
      useFactory: (repository: CategoryRepository) =>
        new DeleteCategoryUseCase(repository),
    },
  ],
})
export class CategoriesModule {}
