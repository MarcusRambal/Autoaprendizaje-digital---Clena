import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/database/prisma.service';
import { Statistics } from '../domain/statistics';
import { StatsRepository } from '../domain/stats.repository';

interface GuideCategoryRow {
  id: string;
  title: string;
  categoryTitle: string;
}

interface TopCategoryRow {
  id: string;
  title: string;
  views: number;
}

function toBogotaDate(value: Date): string {
  return new Date(value.getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

@Injectable()
export class PrismaStatsRepository implements StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(from: Date, to: Date): Promise<Statistics> {
    const [guideCounts, categories, total, attended] = await Promise.all([
      this.prisma.guideView.groupBy({
        by: ['guideId'],
        where: { viewedAt: { gte: from, lte: to } },
        _count: { _all: true },
        orderBy: [{ _count: { guideId: 'desc' } }, { guideId: 'asc' }],
        take: 10,
      }),
      this.prisma.$queryRaw<TopCategoryRow[]>(Prisma.sql`
        SELECT c."id", c."name" AS "title", COUNT(*)::int AS "views"
        FROM "GuideView" gv
        INNER JOIN "Guide" g ON g."id" = gv."guideId"
        INNER JOIN "Category" c ON c."id" = g."categoryId"
        WHERE gv."viewedAt" >= ${from} AND gv."viewedAt" <= ${to}
        GROUP BY c."id", c."name"
        ORDER BY COUNT(*) DESC, c."id" ASC
        LIMIT 10
      `),
      this.prisma.helpRequest.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.helpRequest.count({
        where: {
          status: 'ATTENDED',
          attendedAt: { gte: from, lte: to },
        },
      }),
    ]);

    const guides = guideCounts.length
      ? await this.prisma.guide.findMany({
          where: { id: { in: guideCounts.map((item) => item.guideId) } },
          select: {
            id: true,
            title: true,
            category: { select: { name: true } },
          },
        })
      : [];
    const guidesById = new Map<string, GuideCategoryRow>(
      guides.map((guide) => [
        guide.id,
        {
          id: guide.id,
          title: guide.title,
          categoryTitle: guide.category.name,
        },
      ]),
    );

    return {
      range: { from: toBogotaDate(from), to: toBogotaDate(to) },
      topGuides: guideCounts.flatMap((item) => {
        const guide = guidesById.get(item.guideId);
        return guide ? [{ ...guide, views: item._count._all }] : [];
      }),
      topCategories: categories,
      helpRequests: { total, attended },
    };
  }
}
