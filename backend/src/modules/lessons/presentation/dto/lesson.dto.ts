import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Page } from '../../../../shared/primitives/pagination';
import { PaginationQueryDto } from '../../../../shared/transport/pagination-query.dto';
import type { Lesson, LessonPublicationState } from '../../domain/lesson';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimChoices = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((choice: unknown) =>
        typeof choice === 'string' ? choice.trim() : choice,
      )
    : value;

export class LessonQuestionDto {
  @ApiProperty({ example: '¿Cuál es una contraseña segura?' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  prompt!: string;

  @ApiProperty({
    type: [String],
    minItems: 4,
    maxItems: 4,
    example: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
  })
  @Transform(trimChoices)
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(300, { each: true })
  choices!: string[];

  @ApiProperty({ minimum: 0, maximum: 3 })
  @IsInt()
  @Min(0)
  @Max(3)
  correctOptionIndex!: number;

  @ApiProperty({ example: 'Combina letras, números y símbolos.' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  immediateFeedback!: string;
}

export class LessonContentDto {
  @ApiProperty({ maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ maxLength: 2000 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ type: [LessonQuestionDto], minItems: 1, maxItems: 8 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => LessonQuestionDto)
  questions!: LessonQuestionDto[];
}

export class ListLessonsQueryDto extends PaginationQueryDto {}

export class LessonQuestionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ minimum: 1 })
  orderNumber!: number;

  @ApiProperty()
  prompt!: string;

  @ApiProperty({ type: [String] })
  choices!: string[];

  @ApiProperty({ minimum: 0, maximum: 3 })
  correctOptionIndex!: number;

  @ApiProperty()
  immediateFeedback!: string;
}

export class LessonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true })
  category!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  categoryId!: string | null;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  publicationState!: LessonPublicationState;

  @ApiProperty({ type: [LessonQuestionResponseDto] })
  questions!: LessonQuestionResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class LessonPageResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  items!: LessonResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 3 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export function toLessonResponse(lesson: Lesson): LessonResponseDto {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    category: lesson.categoryTitle,
    categoryId: lesson.categoryId,
    publicationState: lesson.publicationState,
    questions: lesson.questions,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  };
}

export function toLessonPageResponse(
  page: Page<Lesson>,
): LessonPageResponseDto {
  return { ...page, items: page.items.map(toLessonResponse) };
}
