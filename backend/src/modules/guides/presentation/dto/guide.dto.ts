import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Page } from '../../../../shared/primitives/pagination';
import { PaginationQueryDto } from '../../../../shared/transport/pagination-query.dto';
import { Guide } from '../../domain/guide';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateGuideDto {
  @ApiProperty({ example: 'Cómo crear una cuenta de correo', maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ format: 'uuid', description: 'Category the guide belongs to' })
  @IsUUID()
  categoryId!: string;
}

export class UpdateGuideDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class ListGuidesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class GuideResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Cómo crear una cuenta de correo' })
  title!: string;

  @ApiProperty({ example: 'Correo electrónico', description: 'Category title' })
  category!: string;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({
    nullable: true,
    example: 'guia-correo.pdf',
    description: 'Original name of the attached PDF',
  })
  file!: string | null;

  @ApiProperty({
    nullable: true,
    example: '/api/v1/guides/6f0c.../file',
    description: 'Where the PDF can be downloaded or opened',
  })
  fileUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class GuidePageResponseDto {
  @ApiProperty({ type: [GuideResponseDto] })
  items!: GuideResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export function toGuideResponse(guide: Guide): GuideResponseDto {
  return {
    id: guide.id,
    title: guide.title,
    category: guide.categoryTitle,
    categoryId: guide.categoryId,
    file: guide.fileName,
    fileUrl: guide.fileName ? `/api/v1/guides/${guide.id}/file` : null,
    createdAt: guide.createdAt.toISOString(),
  };
}

export function toGuidePageResponse(page: Page<Guide>): GuidePageResponseDto {
  return { ...page, items: page.items.map(toGuideResponse) };
}
