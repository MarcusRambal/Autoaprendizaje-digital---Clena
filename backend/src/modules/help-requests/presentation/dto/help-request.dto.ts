import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
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

  @ApiProperty({ example: 'Correo electrónico', minLength: 3, maxLength: 200 })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic!: string;
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
}

export class HelpRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true, example: 'María López' })
  requesterName!: string | null;

  @ApiProperty({ example: 'Correo electrónico' })
  topic!: string;

  @ApiProperty({
    example: '2026-11-09',
    description: 'Registration date (YYYY-MM-DD, Colombia time)',
  })
  date!: string;

  @ApiProperty({ enum: MANAGED_STATUSES })
  status!: (typeof MANAGED_STATUSES)[number];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
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
    topic: helpRequest.topic,
    date: colombiaDate.format(helpRequest.createdAt),
    status: helpRequest.status as HelpRequestResponseDto['status'],
    createdAt: helpRequest.createdAt.toISOString(),
  };
}

export function toHelpRequestPageResponse(
  page: Page<HelpRequest>,
): HelpRequestPageResponseDto {
  return { ...page, items: page.items.map(toHelpRequestResponse) };
}
