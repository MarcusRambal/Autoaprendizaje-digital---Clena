import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token returned by login or refresh' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
