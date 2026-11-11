import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Page } from '../../../../shared/primitives/pagination';
import { PaginationQueryDto } from '../../../../shared/transport/pagination-query.dto';
import { UserSummary } from '../../domain/user-list.repository';

export const USER_ROLES = ['ADMIN', 'STAFF', 'PUBLIC_USER'] as const;
export const USER_STATUSES = ['ACTIVE', 'DISABLED', 'ARCHIVED'] as const;

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    example: 'maria',
    description: 'Part of the email; ignores upper/lower case',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: USER_ROLES })
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: (typeof USER_ROLES)[number];
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'maria@example.com' })
  email!: string;

  @ApiProperty({ enum: USER_ROLES })
  role!: (typeof USER_ROLES)[number];

  @ApiProperty({ enum: USER_STATUSES })
  status!: (typeof USER_STATUSES)[number];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class UserPageResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items!: UserResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export function toUserResponse(user: UserSummary): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserPageResponse(
  page: Page<UserSummary>,
): UserPageResponseDto {
  return { ...page, items: page.items.map(toUserResponse) };
}
