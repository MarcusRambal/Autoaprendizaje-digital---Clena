import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Page } from '../../../../shared/primitives/pagination';
import { PaginationQueryDto } from '../../../../shared/transport/pagination-query.dto';
import { HelpRequest } from '../../domain/help-request';

export const MANAGED_STATUSES = ['PENDING', 'IN_PROGRESS', 'ATTENDED'] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateHelpRequestDto {
  @ApiProperty({ example: 'María López', maxLength: 100 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  requesterName!: string;

  @ApiProperty({
    example: 'Correo electrónico',
    minLength: 3,
    maxLength: 200,
    description: 'Subject of the request',
  })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic!: string;

  @ApiProperty({
    example: 'No puedo entrar a mi correo y no recuerdo la clave',
    minLength: 1,
    maxLength: 1000,
    description: 'What the person needs, in their own words',
  })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description!: string;
}

export class ChangeHelpRequestStatusDto {
  @ApiProperty({
    enum: MANAGED_STATUSES,
    description:
      'PENDING = Pendiente, IN_PROGRESS = En Atención, ATTENDED = Resuelta',
  })
  @IsIn(MANAGED_STATUSES)
  status!: (typeof MANAGED_STATUSES)[number];
}

export class ListHelpRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MANAGED_STATUSES })
  @IsOptional()
  @IsIn(MANAGED_STATUSES)
  status?: (typeof MANAGED_STATUSES)[number];

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Case-insensitive search in requester name or email',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  requester?: string;

  @ApiPropertyOptional({
    example: '2026-11-09',
    description: 'Filter by the request date in Colombia (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

export class HelpRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true, example: 'María López' })
  requesterName!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'maria@example.com',
    description: 'Email of the account that made the request, if any',
  })
  requesterEmail!: string | null;

  @ApiProperty({ example: 'Correo electrónico', description: 'Subject' })
  topic!: string;

  @ApiProperty({ example: 'No puedo entrar a mi correo' })
  description!: string;

  @ApiProperty({
    example: '2026-11-09',
    description: 'Registration date (YYYY-MM-DD, Colombia time)',
  })
  date!: string;

  @ApiProperty({ enum: MANAGED_STATUSES })
  status!: (typeof MANAGED_STATUSES)[number];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the staff attended it; null while not attended',
  })
  attendedAt!: string | null;
}

export class HelpRequestPageResponseDto {
  @ApiProperty({ type: [HelpRequestResponseDto] })
  items!: HelpRequestResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 3 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

const colombiaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
});

export function toHelpRequestResponse(
  helpRequest: HelpRequest,
): HelpRequestResponseDto {
  return {
    id: helpRequest.id,
    requesterName: helpRequest.requesterName,
    requesterEmail: helpRequest.requesterEmail,
    topic: helpRequest.topic,
    description: helpRequest.description,
    date: colombiaDate.format(helpRequest.createdAt),
    status: helpRequest.status as HelpRequestResponseDto['status'],
    createdAt: helpRequest.createdAt.toISOString(),
    attendedAt: helpRequest.attendedAt?.toISOString() ?? null,
  };
}

export function toHelpRequestPageResponse(
  page: Page<HelpRequest>,
): HelpRequestPageResponseDto {
  return { ...page, items: page.items.map(toHelpRequestResponse) };
}
