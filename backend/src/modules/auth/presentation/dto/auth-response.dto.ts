import { ApiProperty } from '@nestjs/swagger';
import type { AuthUserRole, PublicAuthUser } from '../../domain/auth-user';

export class PublicAuthUserDto implements PublicAuthUser {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['PUBLIC_USER', 'STAFF', 'ADMIN'] })
  role!: AuthUserRole;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: PublicAuthUserDto })
  user!: PublicAuthUserDto;
}
