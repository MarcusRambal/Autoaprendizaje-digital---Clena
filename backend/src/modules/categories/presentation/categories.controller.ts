import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../shared/transport/pagination-query.dto';
import { Authorize } from '../../auth/presentation/authorize.decorator';
import { CreateCategoryUseCase } from '../application/create-category.use-case';
import { DeleteCategoryUseCase } from '../application/delete-category.use-case';
import { ListCategoriesUseCase } from '../application/list-categories.use-case';
import { RenameCategoryUseCase } from '../application/rename-category.use-case';
import {
  CategoryPageResponseDto,
  CategoryResponseDto,
  CategoryTitleDto,
  toCategoryPageResponse,
  toCategoryResponse,
} from './dto/category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly renameCategory: RenameCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description: 'Public. Paginated and sorted by title (asc by default).',
  })
  @ApiOkResponse({ type: CategoryPageResponseDto })
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<CategoryPageResponseDto> {
    return toCategoryPageResponse(await this.listCategories.execute(query));
  }

  @Post()
  @Authorize('ADMIN')
  @ApiOperation({ summary: 'Create a category (admin)' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @ApiConflictResponse({ description: 'A category with that name exists' })
  async create(@Body() body: CategoryTitleDto): Promise<CategoryResponseDto> {
    return toCategoryResponse(
      await this.createCategory.execute({ title: body.title }),
    );
  }

  @Patch(':id')
  @Authorize('ADMIN')
  @ApiOperation({ summary: 'Rename a category (admin)' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiConflictResponse({ description: 'A category with that name exists' })
  async rename(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: CategoryTitleDto,
  ): Promise<CategoryResponseDto> {
    return toCategoryResponse(
      await this.renameCategory.execute({ id, title: body.title }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize('ADMIN')
  @ApiOperation({
    summary: 'Delete a category (admin)',
    description:
      'Categories that still have guides or activities cannot be deleted (409 CATEGORY_IN_USE).',
  })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiConflictResponse({ description: 'The category is in use' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.deleteCategory.execute(id);
  }
}
