import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
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

  @ApiPropertyOptional({
    maxLength: 100,
    example: 'correo',
    description: 'Part of the title or category name; ignores upper/lower case',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;
}

export const GUIDE_STATES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export class ListManagedGuidesQueryDto extends ListGuidesQueryDto {
  @ApiPropertyOptional({
    enum: GUIDE_STATES,
    description: 'Only guides in this state; every state when omitted',
  })
  @IsOptional()
  @IsIn(GUIDE_STATES)
  publicationState?: (typeof GUIDE_STATES)[number];
}

export class SetGuidePublicationDto {
  @ApiProperty({
    description: 'true publishes the guide; false returns it to draft',
  })
  @IsBoolean()
  published!: boolean;
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
    enum: GUIDE_STATES,
    description: 'Only PUBLISHED guides are visible to the public',
  })
  publicationState!: (typeof GUIDE_STATES)[number];

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
    publicationState: guide.publicationState,
    file: guide.fileName,
    // Unpublished PDFs are only reachable through the staff route.
    fileUrl: guide.fileName
      ? guide.publicationState === 'PUBLISHED'
        ? `/api/v1/guides/${guide.id}/file`
        : `/api/v1/guides/manage/${guide.id}/file`
      : null,
    createdAt: guide.createdAt.toISOString(),
  };
}

export function toGuidePageResponse(page: Page<Guide>): GuidePageResponseDto {
  return { ...page, items: page.items.map(toGuideResponse) };
}
