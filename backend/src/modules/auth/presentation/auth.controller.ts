import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthApplicationError } from '../application/auth-application.error';
import type { AuthTokensOutput } from '../application/auth-tokens.output';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { RefreshUseCase } from '../application/refresh.use-case';
import { RegisterUseCase } from '../application/register.use-case';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthThrottleGuard } from './auth-throttle.guard';

const REFRESH_COOKIE = 'refresh_token';
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
});

function getRefreshToken(req: Request): string | null {
  const cookies: unknown = req.cookies;
  if (!cookies || typeof cookies !== 'object') {
    return null;
  }
  const token = Reflect.get(cookies, REFRESH_COOKIE) as unknown;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(AuthThrottleGuard)
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a public user' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    await this.registerUseCase.execute(body);
    const tokens = await this.loginUseCase.execute(body);
    return this.createAuthResponse(tokens, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const tokens = await this.loginUseCase.execute(body);
    return this.createAuthResponse(tokens, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token stored in the HTTP-only cookie',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const tokens = await this.refreshUseCase.execute({ refreshToken });
      return this.createAuthResponse(tokens, res);
    } catch (error) {
      if (error instanceof AuthApplicationError && error.statusCode === 401) {
        this.clearRefreshCookie(res);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the refresh-token family for this device' })
  @ApiNoContentResponse()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = getRefreshToken(req);
    if (refreshToken) {
      await this.logoutUseCase.execute({ refreshToken });
    }
    this.clearRefreshCookie(res);
  }

  private createAuthResponse(
    tokens: AuthTokensOutput,
    res: Response,
  ): AuthResponseDto {
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...refreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken, user: tokens.user };
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  }
}
