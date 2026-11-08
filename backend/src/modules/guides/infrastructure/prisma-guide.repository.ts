import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { isPrismaError } from '../../../shared/database/prisma-errors';
import { PrismaService } from '../../../shared/database/prisma.service';
import { slugify } from '../../../shared/primitives/slug';
import { Guide, GuideFileContent, NewGuideFile } from '../domain/guide';
import {
  CreateGuideResult,
  GuideChanges,
  GuidePage,
  GuideRepository,
  ListGuidesQuery,
  NewGuide,
  UpdateGuideResult,
} from '../domain/guide.repository';

// Never selects the PDF content: listing guides must stay light.
const guideSelect = {
  id: true,
  title: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true } },
  file: { select: { originalName: true } },
} satisfies Prisma.GuideSelect;

type GuideRow = Prisma.GuideGetPayload<{ select: typeof guideSelect }>;

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class PrismaGuideRepository implements GuideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NewGuide): Promise<CreateGuideResult> {
    const baseSlug = slugify(input.title) || 'guia';

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug =
        attempt === 0
          ? baseSlug
          : `${baseSlug}-${randomBytes(3).toString('hex')}`;
      try {
        const row = await this.prisma.guide.create({
          data: {
            title: input.title,
            slug,
            publicationState: 'PUBLISHED',
            categoryId: input.categoryId,
            file: { create: this.toFileData(input.file) },
          },
          select: guideSelect,
        });
        return { kind: 'created', guide: this.toGuide(row) };
      } catch (error) {
        if (isPrismaError(error, 'P2003')) {
          return { kind: 'category-not-found' };
        }
        if (!isPrismaError(error, 'P2002')) {
          throw error;
        }
        // Slug already taken: retry with a random suffix.
      }
    }
    throw new Error('Could not generate a unique guide slug');
  }

  async list(query: ListGuidesQuery): Promise<GuidePage> {
    const where: Prisma.GuideWhereInput = {
      publicationState: 'PUBLISHED',
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.guide.count({ where }),
      this.prisma.guide.findMany({
        where,
        select: guideSelect,
        orderBy: [{ createdAt: query.order }, { id: query.order }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { items: rows.map((row) => this.toGuide(row)), total };
  }

  async findById(id: string): Promise<Guide | null> {
    const row = await this.prisma.guide.findFirst({
      where: { id, publicationState: 'PUBLISHED' },
      select: guideSelect,
    });
    return row ? this.toGuide(row) : null;
  }

  async findFile(id: string): Promise<GuideFileContent | null> {
    const file = await this.prisma.guideFile.findFirst({
      where: { guideId: id, guide: { publicationState: 'PUBLISHED' } },
    });
    return file
      ? {
          fileName: file.originalName,
          contentType: file.contentType,
          content: file.content,
        }
      : null;
  }

  async update(id: string, changes: GuideChanges): Promise<UpdateGuideResult> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.guide.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!existing) {
          return { kind: 'not-found' as const };
        }
        if (changes.categoryId) {
          const category = await transaction.category.findUnique({
            where: { id: changes.categoryId },
            select: { id: true },
          });
          if (!category) {
            return { kind: 'category-not-found' as const };
          }
        }

        const row = await transaction.guide.update({
          where: { id },
          data: {
            ...(changes.title !== undefined ? { title: changes.title } : {}),
            ...(changes.categoryId !== undefined
              ? { categoryId: changes.categoryId }
              : {}),
            ...(changes.file
              ? {
                  file: {
                    upsert: {
                      create: this.toFileData(changes.file),
                      update: this.toFileData(changes.file),
                    },
                  },
                }
              : {}),
          },
          select: guideSelect,
        });
        return { kind: 'updated' as const, guide: this.toGuide(row) };
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<'deleted' | 'not-found'> {
    try {
      await this.prisma.$transaction([
        // Steps use ON DELETE RESTRICT, so they go first. The PDF cascades.
        this.prisma.guideStep.deleteMany({ where: { guideId: id } }),
        this.prisma.guide.delete({ where: { id } }),
      ]);
      return 'deleted';
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return 'not-found';
      }
      throw error;
    }
  }

  private toFileData(file: NewGuideFile) {
    return {
      originalName: file.originalName,
      contentType: 'application/pdf',
      sizeBytes: file.content.length,
      content: Buffer.from(file.content),
    };
  }

  private toGuide(row: GuideRow): Guide {
    return {
      id: row.id,
      title: row.title,
      categoryId: row.categoryId,
      categoryTitle: row.category.name,
      fileName: row.file?.originalName ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
