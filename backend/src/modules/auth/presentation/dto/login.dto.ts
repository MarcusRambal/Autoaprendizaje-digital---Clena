import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { MaxUtf8Bytes } from './max-utf8-bytes.validator';

export class LoginDto {
  @ApiProperty({ example: 'person@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'strong-password',
    description: 'Password limited to 72 UTF-8 bytes',
  })
  @IsString()
  @MinLength(1)
  @MaxUtf8Bytes(72)
  password!: string;
}
