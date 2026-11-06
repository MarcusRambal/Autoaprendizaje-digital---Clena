import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../src/shared/database/prisma.service';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication<App> | undefined;
  const getApp = (): INestApplication<App> => {
    if (!app) {
      throw new Error('Health E2E application is not initialized');
    }

    return app;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_ACCESS_SECRET =
      'test-access-secret-that-is-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-that-is-at-least-32-characters';
    process.env.NODE_ENV = 'test';

    const { AppModule } =
      jest.requireActual<typeof import('../src/app.module')>(
        '../src/app.module',
      );
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication<INestApplication<App>>();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns a small status payload at GET /health', async () => {
    await request(getApp().getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('does not expose the generated root route', async () => {
    await request(getApp().getHttpServer()).get('/').expect(404);
  });
});
