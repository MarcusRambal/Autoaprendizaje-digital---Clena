import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { JwtTokenIssuer } from '../../src/modules/auth/infrastructure/jwt-token-issuer';
import { PrismaService } from '../../src/shared/database/prisma.service';
import { GlobalExceptionFilter } from '../../src/shared/errors/global-exception.filter';

interface AuthResponse {
  refreshToken: string;
}

describe('refresh token rotation race against PostgreSQL', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenIssuer: JwtTokenIssuer;
  let requestIp = 1;

  function authPost(path: string) {
    const ip = `192.0.2.${requestIp++}`;
    return request(app.getHttpServer())
      .post(`/api/v1/auth/${path}`)
      .set('x-forwarded-for', ip);
  }

  beforeAll(async () => {
    app = await NestFactory.create<
      INestApplication<App> & NestExpressApplication
    >(AppModule, { logger: false });
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    expressApp.set('trust proxy', true);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    tokenIssuer = app.get(JwtTokenIssuer);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rotates once, rejects the replay, and revokes every session in the family', async () => {
    const email = `refresh-race-${randomUUID()}@example.com`;
    const password = 'integration-test-password';
    try {
      const registration = await authPost('register')
        .send({ email, password })
        .expect(201);
      const rawRefreshToken = (registration.body as AuthResponse).refreshToken;
      const verifiedToken =
        await tokenIssuer.verifyRefreshToken(rawRefreshToken);
      expect(verifiedToken).not.toBeNull();
      if (!verifiedToken) {
        throw new Error('Registration returned an invalid refresh token');
      }

      const responses = await Promise.all([
        authPost('refresh').send({ refreshToken: rawRefreshToken }),
        authPost('refresh').send({ refreshToken: rawRefreshToken }),
      ]);

      const successes = responses.filter(({ status }) => status === 200);
      const rejections = responses.filter(({ status }) => status === 401);
      expect(successes).toHaveLength(1);
      expect(rejections).toHaveLength(1);
      expect(responses.every(({ status }) => [200, 401].includes(status))).toBe(
        true,
      );

      const familySessions = await prisma.refreshSession.findMany({
        where: { familyId: verifiedToken.familyId },
      });
      expect(familySessions.length).toBeGreaterThanOrEqual(1);
      expect(familySessions.every(({ revokedAt }) => revokedAt !== null)).toBe(
        true,
      );
    } finally {
      await prisma.user.deleteMany({ where: { email } });
    }
  });

  it('runs register, login, refresh, and idempotent logout against PostgreSQL', async () => {
    const email = `auth-flow-${randomUUID()}@example.com`;
    const password = 'integration-test-password';
    try {
      await authPost('register').send({ email, password }).expect(201);

      const login = await authPost('login')
        .send({ email: email.toUpperCase(), password })
        .expect(200);
      const refreshToken = (login.body as AuthResponse).refreshToken;

      const refresh = await authPost('refresh')
        .send({ refreshToken })
        .expect(200);
      const rotatedRefreshToken = (refresh.body as AuthResponse).refreshToken;

      await authPost('logout')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(204);
      await authPost('logout')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(204);
      await authPost('refresh')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(401);
      await authPost('logout')
        .send({ refreshToken: 'invalid-token' })
        .expect(204);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
    }
  });
});
