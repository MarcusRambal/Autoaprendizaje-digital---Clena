import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { MaxUtf8Bytes } from '../../../auth/presentation/dto/max-utf8-bytes.validator';
import { CreatedUser } from '../../domain/user-account.repository';

const CREATABLE_USER_ROLES = ['STAFF', 'PUBLIC_USER'] as const;

export class CreateUserDto {
  @ApiProperty({ example: 'person@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 8,
    example: 'strong-password',
    description: 'Password limited to 72 UTF-8 bytes',
  })
  @IsString()
  @MinLength(8)
  @MaxUtf8Bytes(72)
  password!: string;

  @ApiProperty({ enum: CREATABLE_USER_ROLES })
  @IsIn(CREATABLE_USER_ROLES)
  role!: (typeof CREATABLE_USER_ROLES)[number];
}

export class CreateUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'person@example.com' })
  email!: string;

  @ApiProperty({ enum: CREATABLE_USER_ROLES })
  role!: (typeof CREATABLE_USER_ROLES)[number];

  @ApiProperty({ enum: ['ACTIVE', 'DISABLED', 'ARCHIVED'] })
  status!: CreatedUser['status'];
}

export function toCreateUserResponse(user: CreatedUser): CreateUserResponseDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
