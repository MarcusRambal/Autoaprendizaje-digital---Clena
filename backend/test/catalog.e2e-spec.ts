import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { CategoryApplicationError } from '../src/modules/categories/application/category-application.error';
import { CreateCategoryUseCase } from '../src/modules/categories/application/create-category.use-case';
import { DeleteCategoryUseCase } from '../src/modules/categories/application/delete-category.use-case';
import { ListCategoriesUseCase } from '../src/modules/categories/application/list-categories.use-case';
import { RenameCategoryUseCase } from '../src/modules/categories/application/rename-category.use-case';
import { CreateGuideUseCase } from '../src/modules/guides/application/create-guide.use-case';
import { DeleteGuideUseCase } from '../src/modules/guides/application/delete-guide.use-case';
import { GetGuideFileUseCase } from '../src/modules/guides/application/get-guide-file.use-case';
import { GetGuideUseCase } from '../src/modules/guides/application/get-guide.use-case';
import { GuideApplicationError } from '../src/modules/guides/application/guide-application.error';
import { ListGuidesUseCase } from '../src/modules/guides/application/list-guides.use-case';
import { UpdateGuideUseCase } from '../src/modules/guides/application/update-guide.use-case';
import { Guide } from '../src/modules/guides/domain/guide';
import { ChangeHelpRequestStatusUseCase } from '../src/modules/help-requests/application/change-help-request-status.use-case';
import { CreateHelpRequestUseCase } from '../src/modules/help-requests/application/create-help-request.use-case';
import { DeleteHelpRequestUseCase } from '../src/modules/help-requests/application/delete-help-request.use-case';
import { HelpRequestApplicationError } from '../src/modules/help-requests/application/help-request-application.error';
import { ListHelpRequestsUseCase } from '../src/modules/help-requests/application/list-help-requests.use-case';
import { HelpRequest } from '../src/modules/help-requests/domain/help-request';
import { DeleteUserAccountUseCase } from '../src/modules/users/application/delete-user-account.use-case';
import { UserApplicationError } from '../src/modules/users/application/user-application.error';
import { PrismaService } from '../src/shared/database/prisma.service';
import { GlobalExceptionFilter } from '../src/shared/errors/global-exception.filter';

const ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-characters';
const configValues: Record<string, unknown> = {
  DATABASE_URL: 'postgresql://localhost:5432/test',
  JWT_ACCESS_SECRET: ACCESS_SECRET,
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  BCRYPT_SALT_ROUNDS: 10,
  AUTH_THROTTLE_LIMIT: 100,
  AUTH_THROTTLE_TTL: 60000,
  TRUSTED_PROXY_IPS: [],
};

const ID = '5b1f2c1e-0f4e-4c53-9d7e-6b1a3a1c9a10';
const CATEGORY_ID = '0b9d5f7a-3d1c-4b8e-8a55-2c1f9e3a7b44';

const guide: Guide = {
  id: ID,
  title: 'Cómo crear una cuenta',
  categoryId: CATEGORY_ID,
  categoryTitle: 'Correo electrónico',
  fileName: 'guia.pdf',
  createdAt: new Date('2026-11-09T10:00:00.000Z'),
  updatedAt: new Date('2026-11-09T10:00:00.000Z'),
};

const helpRequest: HelpRequest = {
  id: ID,
  requesterName: 'María López',
  topic: 'Correo electrónico',
  status: 'PENDING',
  attendedById: null,
  attendedAt: null,
  // 22:00 on Nov 9 in Colombia (UTC-5) is already Nov 10 in UTC.
  createdAt: new Date('2026-11-10T03:00:00.000Z'),
};

const pdfBytes = Buffer.from('%PDF-1.4 contenido de prueba');

type Role = 'PUBLIC_USER' | 'STAFF' | 'ADMIN';

describe('Catalog endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  const fakes = {
    createCategory: { execute: jest.fn() },
    listCategories: { execute: jest.fn() },
    renameCategory: { execute: jest.fn() },
    deleteCategory: { execute: jest.fn() },
    createGuide: { execute: jest.fn() },
    listGuides: { execute: jest.fn() },
    getGuide: { execute: jest.fn() },
    getGuideFile: { execute: jest.fn() },
    updateGuide: { execute: jest.fn() },
    deleteGuide: { execute: jest.fn() },
    createHelpRequest: { execute: jest.fn() },
    listHelpRequests: { execute: jest.fn() },
    changeStatus: { execute: jest.fn() },
    deleteHelpRequest: { execute: jest.fn() },
    deleteAccount: { execute: jest.fn() },
  };

  const bearer = (role: Role, sub = 'user-1') =>
    `Bearer ${jwt.sign(
      { sub, email: `${sub}@example.com`, role },
      { secret: ACCESS_SECRET, expiresIn: '15m' },
    )}`;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-that-is-at-least-32-characters';
    process.env.AUTH_THROTTLE_LIMIT = '100';
    process.env.AUTH_THROTTLE_TTL = '60000';
    process.env.NODE_ENV = 'test';

    const { AppModule } =
      jest.requireActual<typeof import('../src/app.module')>(
        '../src/app.module',
      );
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CreateCategoryUseCase)
      .useValue(fakes.createCategory)
      .overrideProvider(ListCategoriesUseCase)
      .useValue(fakes.listCategories)
      .overrideProvider(RenameCategoryUseCase)
      .useValue(fakes.renameCategory)
      .overrideProvider(DeleteCategoryUseCase)
      .useValue(fakes.deleteCategory)
      .overrideProvider(CreateGuideUseCase)
      .useValue(fakes.createGuide)
      .overrideProvider(ListGuidesUseCase)
      .useValue(fakes.listGuides)
      .overrideProvider(GetGuideUseCase)
      .useValue(fakes.getGuide)
      .overrideProvider(GetGuideFileUseCase)
      .useValue(fakes.getGuideFile)
      .overrideProvider(UpdateGuideUseCase)
      .useValue(fakes.updateGuide)
      .overrideProvider(DeleteGuideUseCase)
      .useValue(fakes.deleteGuide)
      .overrideProvider(CreateHelpRequestUseCase)
      .useValue(fakes.createHelpRequest)
      .overrideProvider(ListHelpRequestsUseCase)
      .useValue(fakes.listHelpRequests)
      .overrideProvider(ChangeHelpRequestStatusUseCase)
      .useValue(fakes.changeStatus)
      .overrideProvider(DeleteHelpRequestUseCase)
      .useValue(fakes.deleteHelpRequest)
      .overrideProvider(DeleteUserAccountUseCase)
      .useValue(fakes.deleteAccount)
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string, fallback?: unknown) => configValues[key] ?? fallback,
        getOrThrow: (key: string) => {
          const value = configValues[key];
          if (value === undefined) {
            throw new Error(`Unexpected config key: ${key}`);
          }
          return value;
        },
      })
      .compile();

    app = moduleRef.createNestApplication<INestApplication<App>>();
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
    jwt = moduleRef.get(JwtService, { strict: false });
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    Object.values(fakes).forEach((fake) => fake.execute.mockReset());
  });

  describe('categories', () => {
    it('lists categories without authentication', async () => {
      fakes.listCategories.execute.mockResolvedValue({
        items: [{ id: CATEGORY_ID, title: 'Correo', slug: 'correo' }],
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
      });

      const response = await http()
        .get('/api/v1/categories')
        .query({ pageSize: '100', order: 'desc' })
        .expect(200);

      expect(fakes.listCategories.execute).toHaveBeenCalledWith({
        pageSize: 100,
        order: 'desc',
      });
      expect(response.body).toEqual({
        items: [{ id: CATEGORY_ID, title: 'Correo' }],
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
      });
    });

    it.each([{ pageSize: '101' }, { page: '0' }, { order: 'up' }, { x: '1' }])(
      'rejects the list query %j',
      async (query) => {
        await http().get('/api/v1/categories').query(query).expect(400);
        expect(fakes.listCategories.execute).not.toHaveBeenCalled();
      },
    );

    it('only lets an admin create a category', async () => {
      await http()
        .post('/api/v1/categories')
        .send({ title: 'Redes' })
        .expect(401);
      for (const role of ['PUBLIC_USER', 'STAFF'] as const) {
        await http()
          .post('/api/v1/categories')
          .set('Authorization', bearer(role))
          .send({ title: 'Redes' })
          .expect(403);
      }
      expect(fakes.createCategory.execute).not.toHaveBeenCalled();

      fakes.createCategory.execute.mockResolvedValue({
        id: CATEGORY_ID,
        title: 'Redes',
        slug: 'redes',
      });
      const response = await http()
        .post('/api/v1/categories')
        .set('Authorization', bearer('ADMIN'))
        .send({ title: '  Redes  ' })
        .expect(201);

      expect(fakes.createCategory.execute).toHaveBeenCalledWith({
        title: 'Redes',
      });
      expect(response.body).toEqual({ id: CATEGORY_ID, title: 'Redes' });
    });

    it.each([
      ['an empty title', { title: '' }],
      ['a missing title', {}],
      ['a title over 80 characters', { title: 'x'.repeat(81) }],
      ['an unknown property', { title: 'Redes', slug: 'hack' }],
    ])('rejects %s', async (_name, body) => {
      await http()
        .post('/api/v1/categories')
        .set('Authorization', bearer('ADMIN'))
        .send(body)
        .expect(400);
      expect(fakes.createCategory.execute).not.toHaveBeenCalled();
    });

    it('returns 409 with a code when the category already exists', async () => {
      fakes.createCategory.execute.mockRejectedValue(
        new CategoryApplicationError(409, 'CATEGORY_ALREADY_EXISTS', 'exists'),
      );

      const response = await http()
        .post('/api/v1/categories')
        .set('Authorization', bearer('ADMIN'))
        .send({ title: 'Redes' })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        code: 'CATEGORY_ALREADY_EXISTS',
      });
    });

    it('renames a category (admin only, UUID required)', async () => {
      fakes.renameCategory.execute.mockResolvedValue({
        id: CATEGORY_ID,
        title: 'Nuevo',
        slug: 'nuevo',
      });

      await http()
        .patch(`/api/v1/categories/${CATEGORY_ID}`)
        .set('Authorization', bearer('STAFF'))
        .send({ title: 'Nuevo' })
        .expect(403);
      await http()
        .patch('/api/v1/categories/123')
        .set('Authorization', bearer('ADMIN'))
        .send({ title: 'Nuevo' })
        .expect(400);
      const response = await http()
        .patch(`/api/v1/categories/${CATEGORY_ID}`)
        .set('Authorization', bearer('ADMIN'))
        .send({ title: 'Nuevo' })
        .expect(200);

      expect(fakes.renameCategory.execute).toHaveBeenCalledWith({
        id: CATEGORY_ID,
        title: 'Nuevo',
      });
      expect(response.body).toEqual({ id: CATEGORY_ID, title: 'Nuevo' });
    });

    it('maps a missing category to 404 on rename', async () => {
      fakes.renameCategory.execute.mockRejectedValue(
        new CategoryApplicationError(404, 'CATEGORY_NOT_FOUND', 'missing'),
      );

      await http()
        .patch(`/api/v1/categories/${CATEGORY_ID}`)
        .set('Authorization', bearer('ADMIN'))
        .send({ title: 'Nuevo' })
        .expect(404);
    });

    it('deletes a category with 204, or explains why it cannot', async () => {
      await http()
        .delete(`/api/v1/categories/${CATEGORY_ID}`)
        .set('Authorization', bearer('STAFF'))
        .expect(403);

      fakes.deleteCategory.execute.mockResolvedValueOnce(undefined);
      await http()
        .delete(`/api/v1/categories/${CATEGORY_ID}`)
        .set('Authorization', bearer('ADMIN'))
        .expect(204);
      expect(fakes.deleteCategory.execute).toHaveBeenCalledWith(CATEGORY_ID);

      fakes.deleteCategory.execute.mockRejectedValueOnce(
        new CategoryApplicationError(409, 'CATEGORY_IN_USE', 'in use'),
      );
      const response = await http()
        .delete(`/api/v1/categories/${CATEGORY_ID}`)
        .set('Authorization', bearer('ADMIN'))
        .expect(409);
      expect(response.body).toMatchObject({ code: 'CATEGORY_IN_USE' });
    });
  });

  describe('guides', () => {
    it('lists guides without authentication, in the frontend shape', async () => {
      fakes.listGuides.execute.mockResolvedValue({
        items: [guide],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });

      const response = await http()
        .get('/api/v1/guides')
        .query({ categoryId: CATEGORY_ID, page: '1' })
        .expect(200);

      expect(fakes.listGuides.execute).toHaveBeenCalledWith({
        categoryId: CATEGORY_ID,
        page: 1,
      });
      expect(response.body).toEqual({
        items: [
          {
            id: ID,
            title: 'Cómo crear una cuenta',
            category: 'Correo electrónico',
            categoryId: CATEGORY_ID,
            file: 'guia.pdf',
            fileUrl: `/api/v1/guides/${ID}/file`,
            createdAt: '2026-11-09T10:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('rejects an invalid category filter', async () => {
      await http()
        .get('/api/v1/guides')
        .query({ categoryId: 'nope' })
        .expect(400);
    });

    it('returns null file fields for a guide without PDF', async () => {
      fakes.getGuide.execute.mockResolvedValue({ ...guide, fileName: null });

      const response = await http().get(`/api/v1/guides/${ID}`).expect(200);

      expect(response.body).toMatchObject({ file: null, fileUrl: null });
    });

    it('maps a missing guide to 404', async () => {
      fakes.getGuide.execute.mockRejectedValue(
        new GuideApplicationError(404, 'GUIDE_NOT_FOUND', 'missing'),
      );

      const response = await http().get(`/api/v1/guides/${ID}`).expect(404);

      expect(response.body).toMatchObject({ code: 'GUIDE_NOT_FOUND' });
    });

    it('serves the PDF inline with safe headers', async () => {
      fakes.getGuideFile.execute.mockResolvedValue({
        fileName: 'guía de correo.pdf',
        contentType: 'application/pdf',
        content: pdfBytes,
      });

      const response = await http()
        .get(`/api/v1/guides/${ID}/file`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toBe(
        "inline; filename*=UTF-8''gu%C3%ADa%20de%20correo.pdf",
      );
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.from(response.body as Buffer).equals(pdfBytes)).toBe(true);
    });

    it('uploads a PDF in a multipart request (staff or admin only)', async () => {
      fakes.createGuide.execute.mockResolvedValue(guide);

      await http()
        .post('/api/v1/guides')
        .field('title', 'Guía')
        .field('categoryId', CATEGORY_ID)
        .attach('file', pdfBytes, 'guia.pdf')
        .expect(401);
      await http()
        .post('/api/v1/guides')
        .set('Authorization', bearer('PUBLIC_USER'))
        .field('title', 'Guía')
        .field('categoryId', CATEGORY_ID)
        .attach('file', pdfBytes, 'guia.pdf')
        .expect(403);
      expect(fakes.createGuide.execute).not.toHaveBeenCalled();

      const response = await http()
        .post('/api/v1/guides')
        .set('Authorization', bearer('STAFF'))
        .field('title', '  Cómo crear una cuenta  ')
        .field('categoryId', CATEGORY_ID)
        .attach('file', pdfBytes, {
          filename: 'guía correo.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const call = (
        fakes.createGuide.execute.mock.calls as unknown[][]
      )[0][0] as {
        title: string;
        categoryId: string;
        file: { originalName: string; content: Buffer };
      };
      expect(call.title).toBe('Cómo crear una cuenta');
      expect(call.categoryId).toBe(CATEGORY_ID);
      expect(call.file.originalName).toBe('guía correo.pdf');
      expect(call.file.content.equals(pdfBytes)).toBe(true);
      expect(response.body).toMatchObject({ id: ID, file: 'guia.pdf' });
    });

    it.each([
      ['a missing title', { categoryId: CATEGORY_ID }],
      ['an invalid category id', { title: 'Guía', categoryId: 'nope' }],
      [
        'an unknown field',
        { title: 'Guía', categoryId: CATEGORY_ID, slug: 'hack' },
      ],
    ])('rejects a guide with %s', async (_name, fields) => {
      let upload = http()
        .post('/api/v1/guides')
        .set('Authorization', bearer('ADMIN'));
      for (const [key, value] of Object.entries(fields)) {
        upload = upload.field(key, value);
      }

      await upload.attach('file', pdfBytes, 'guia.pdf').expect(400);
      expect(fakes.createGuide.execute).not.toHaveBeenCalled();
    });

    it('hands the use case no file when none is sent', async () => {
      fakes.createGuide.execute.mockRejectedValue(
        new GuideApplicationError(400, 'INVALID_GUIDE_FILE', 'file required'),
      );

      const response = await http()
        .post('/api/v1/guides')
        .set('Authorization', bearer('ADMIN'))
        .field('title', 'Guía')
        .field('categoryId', CATEGORY_ID)
        .expect(400);

      expect(fakes.createGuide.execute).toHaveBeenCalledWith({
        title: 'Guía',
        categoryId: CATEGORY_ID,
        file: undefined,
      });
      expect(response.body).toMatchObject({ code: 'INVALID_GUIDE_FILE' });
    });

    it('rejects a PDF over the 10 MB limit before reaching the use case', async () => {
      const response = await http()
        .post('/api/v1/guides')
        .set('Authorization', bearer('ADMIN'))
        .field('title', 'Guía')
        .field('categoryId', CATEGORY_ID)
        .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1, 0x20), 'big.pdf')
        .expect(413);

      expect(response.body).toMatchObject({ statusCode: 413 });
      expect(fakes.createGuide.execute).not.toHaveBeenCalled();
    });

    it('edits a guide with only some fields', async () => {
      fakes.updateGuide.execute.mockResolvedValue(guide);

      await http()
        .patch(`/api/v1/guides/${ID}`)
        .set('Authorization', bearer('PUBLIC_USER'))
        .field('title', 'Nuevo')
        .expect(403);
      await http()
        .patch(`/api/v1/guides/${ID}`)
        .set('Authorization', bearer('STAFF'))
        .field('title', 'Nuevo título')
        .expect(200);

      expect(fakes.updateGuide.execute).toHaveBeenCalledWith({
        id: ID,
        title: 'Nuevo título',
        categoryId: undefined,
        file: undefined,
      });
    });

    it('deletes a guide with 204 and maps a missing one to 404', async () => {
      fakes.deleteGuide.execute.mockResolvedValueOnce(undefined);
      await http()
        .delete(`/api/v1/guides/${ID}`)
        .set('Authorization', bearer('STAFF'))
        .expect(204);

      fakes.deleteGuide.execute.mockRejectedValueOnce(
        new GuideApplicationError(404, 'GUIDE_NOT_FOUND', 'missing'),
      );
      await http()
        .delete(`/api/v1/guides/${ID}`)
        .set('Authorization', bearer('ADMIN'))
        .expect(404);
      await http()
        .delete(`/api/v1/guides/${ID}`)
        .set('Authorization', bearer('PUBLIC_USER'))
        .expect(403);
    });
  });

  describe('help requests', () => {
    it('is closed to public users and anonymous callers', async () => {
      await http().get('/api/v1/help-requests').expect(401);
      await http()
        .get('/api/v1/help-requests')
        .set('Authorization', bearer('PUBLIC_USER'))
        .expect(403);
      await http()
        .post('/api/v1/help-requests')
        .set('Authorization', bearer('PUBLIC_USER'))
        .send({ requesterName: 'María', topic: 'Correo' })
        .expect(403);
      expect(fakes.createHelpRequest.execute).not.toHaveBeenCalled();
      expect(fakes.listHelpRequests.execute).not.toHaveBeenCalled();
    });

    it('registers a request and returns it in the frontend shape', async () => {
      fakes.createHelpRequest.execute.mockResolvedValue(helpRequest);

      const response = await http()
        .post('/api/v1/help-requests')
        .set('Authorization', bearer('STAFF'))
        .send({ requesterName: ' María López ', topic: ' Correo electrónico ' })
        .expect(201);

      expect(fakes.createHelpRequest.execute).toHaveBeenCalledWith({
        requesterName: 'María López',
        topic: 'Correo electrónico',
      });
      expect(response.body).toEqual({
        id: ID,
        requesterName: 'María López',
        topic: 'Correo electrónico',
        date: '2026-11-09',
        status: 'PENDING',
        createdAt: '2026-11-10T03:00:00.000Z',
      });
    });

    it.each([
      ['a missing name', { topic: 'Correo' }],
      ['a short topic', { requesterName: 'María', topic: 'ab' }],
      ['an unknown property', { requesterName: 'M', topic: 'Correo', x: 1 }],
    ])('rejects %s', async (_name, body) => {
      await http()
        .post('/api/v1/help-requests')
        .set('Authorization', bearer('ADMIN'))
        .send(body)
        .expect(400);
      expect(fakes.createHelpRequest.execute).not.toHaveBeenCalled();
    });

    it('lists a page with parsed filters', async () => {
      fakes.listHelpRequests.execute.mockResolvedValue({
        items: [helpRequest],
        page: 2,
        pageSize: 10,
        total: 11,
        totalPages: 2,
      });

      const response = await http()
        .get('/api/v1/help-requests')
        .query({ status: 'PENDING', order: 'desc', page: '2', pageSize: '10' })
        .set('Authorization', bearer('STAFF'))
        .expect(200);

      expect(fakes.listHelpRequests.execute).toHaveBeenCalledWith({
        status: 'PENDING',
        order: 'desc',
        page: 2,
        pageSize: 10,
      });
      expect(response.body).toMatchObject({
        page: 2,
        pageSize: 10,
        total: 11,
        totalPages: 2,
      });
    });

    it.each([
      { status: 'CANCELLED' },
      { status: 'DONE' },
      { pageSize: '101' },
      { guideId: 'x' },
    ])('rejects the list query %j', async (query) => {
      await http()
        .get('/api/v1/help-requests')
        .query(query)
        .set('Authorization', bearer('STAFF'))
        .expect(400);
    });

    it('changes the status and records who did it', async () => {
      fakes.changeStatus.execute.mockResolvedValue({
        ...helpRequest,
        status: 'ATTENDED',
      });

      const response = await http()
        .patch(`/api/v1/help-requests/${ID}`)
        .set('Authorization', bearer('STAFF', 'staff-1'))
        .send({ status: 'ATTENDED' })
        .expect(200);

      expect(fakes.changeStatus.execute).toHaveBeenCalledWith({
        id: ID,
        status: 'ATTENDED',
        changedById: 'staff-1',
      });
      expect(response.body).toMatchObject({ status: 'ATTENDED' });
    });

    it.each([{ status: 'CANCELLED' }, { status: 'Resuelta' }, {}])(
      'rejects the status change %j',
      async (body) => {
        await http()
          .patch(`/api/v1/help-requests/${ID}`)
          .set('Authorization', bearer('STAFF'))
          .send(body)
          .expect(400);
        expect(fakes.changeStatus.execute).not.toHaveBeenCalled();
      },
    );

    it('maps a missing request to 404 and deletes with 204', async () => {
      fakes.changeStatus.execute.mockRejectedValue(
        new HelpRequestApplicationError(
          404,
          'HELP_REQUEST_NOT_FOUND',
          'missing',
        ),
      );
      await http()
        .patch(`/api/v1/help-requests/${ID}`)
        .set('Authorization', bearer('ADMIN'))
        .send({ status: 'PENDING' })
        .expect(404);

      fakes.deleteHelpRequest.execute.mockResolvedValue(undefined);
      await http()
        .delete(`/api/v1/help-requests/${ID}`)
        .set('Authorization', bearer('STAFF'))
        .expect(204);
      expect(fakes.deleteHelpRequest.execute).toHaveBeenCalledWith(ID);
      await http()
        .delete('/api/v1/help-requests/123')
        .set('Authorization', bearer('STAFF'))
        .expect(400);
    });
  });

  describe('users', () => {
    it('lets any signed-in user erase their own account', async () => {
      fakes.deleteAccount.execute.mockResolvedValue(undefined);

      await http().delete('/api/v1/users/me').expect(401);
      for (const role of ['PUBLIC_USER', 'STAFF'] as const) {
        await http()
          .delete('/api/v1/users/me')
          .set('Authorization', bearer(role, 'user-9'))
          .expect(204);
      }

      expect(fakes.deleteAccount.execute).toHaveBeenCalledTimes(2);
      expect(fakes.deleteAccount.execute).toHaveBeenCalledWith('user-9');
    });

    it('protects administrator accounts', async () => {
      fakes.deleteAccount.execute.mockRejectedValue(
        new UserApplicationError(409, 'ADMIN_ACCOUNT_PROTECTED', 'protected'),
      );

      const response = await http()
        .delete('/api/v1/users/me')
        .set('Authorization', bearer('ADMIN'))
        .expect(409);

      expect(response.body).toMatchObject({ code: 'ADMIN_ACCOUNT_PROTECTED' });
    });

    it('lets only an admin erase another account', async () => {
      fakes.deleteAccount.execute.mockResolvedValue(undefined);

      await http()
        .delete(`/api/v1/users/${ID}`)
        .set('Authorization', bearer('STAFF'))
        .expect(403);
      await http()
        .delete('/api/v1/users/123')
        .set('Authorization', bearer('ADMIN'))
        .expect(400);
      await http()
        .delete(`/api/v1/users/${ID}`)
        .set('Authorization', bearer('ADMIN'))
        .expect(204);

      expect(fakes.deleteAccount.execute).toHaveBeenCalledTimes(1);
      expect(fakes.deleteAccount.execute).toHaveBeenCalledWith(ID);
    });

    it('maps an unknown user to 404', async () => {
      fakes.deleteAccount.execute.mockRejectedValue(
        new UserApplicationError(404, 'USER_NOT_FOUND', 'missing'),
      );

      await http()
        .delete(`/api/v1/users/${ID}`)
        .set('Authorization', bearer('ADMIN'))
        .expect(404);
    });
  });
});
