import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Page } from '../../../../shared/primitives/pagination';
import { Category } from '../../domain/category';

export class CategoryTitleDto {
  @ApiProperty({ example: 'Correo electrónico', maxLength: 80 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title!: string;
}

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Correo electrónico' })
  title!: string;
}

export class CategoryPageResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  items!: CategoryResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 4 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export function toCategoryResponse(category: Category): CategoryResponseDto {
  return { id: category.id, title: category.title };
}

export function toCategoryPageResponse(
  page: Page<Category>,
): CategoryPageResponseDto {
  return { ...page, items: page.items.map(toCategoryResponse) };
}
