import { Injectable } from '@nestjs/common';
import { isPrismaError } from '../../../shared/database/prisma-errors';
import { PrismaService } from '../../../shared/database/prisma.service';
import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import { Category } from '../domain/category';
import {
  CategoryData,
  CategoryPage,
  CategoryRepository,
  CreateCategoryResult,
  DeleteCategoryResult,
  RenameCategoryResult,
} from '../domain/category.repository';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CategoryData): Promise<CreateCategoryResult> {
    try {
      const row = await this.prisma.category.create({
        data: { name: data.title, slug: data.slug },
      });
      return { kind: 'created', category: this.toCategory(row) };
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        return { kind: 'duplicate' };
      }
      throw error;
    }
  }

  async list(page: PageRequest, order: SortOrder): Promise<CategoryPage> {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.category.count(),
      this.prisma.category.findMany({
        orderBy: [{ name: order }, { id: order }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
      }),
    ]);
    return { items: rows.map((row) => this.toCategory(row)), total };
  }

  async rename(id: string, data: CategoryData): Promise<RenameCategoryResult> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: { name: data.title, slug: data.slug },
      });
      return { kind: 'renamed', category: this.toCategory(row) };
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      if (isPrismaError(error, 'P2002')) {
        return { kind: 'duplicate' };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<DeleteCategoryResult> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const category = await transaction.category.findUnique({
          where: { id },
          select: { _count: { select: { guides: true, activities: true } } },
        });
        if (!category) {
          return { kind: 'not-found' as const };
        }
        if (category._count.guides > 0 || category._count.activities > 0) {
          return { kind: 'in-use' as const };
        }
        await transaction.category.delete({ where: { id } });
        return { kind: 'deleted' as const };
      });
    } catch (error) {
      // A guide was attached between the check and the delete.
      if (isPrismaError(error, 'P2003')) {
        return { kind: 'in-use' };
      }
      if (isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      throw error;
    }
  }

  private toCategory(row: {
    id: string;
    name: string;
    slug: string;
  }): Category {
    return { id: row.id, title: row.name, slug: row.slug };
  }
}
