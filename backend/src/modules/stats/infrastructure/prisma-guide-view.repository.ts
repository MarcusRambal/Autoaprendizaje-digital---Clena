import { Injectable } from '@nestjs/common';
import { isPrismaError } from '../../../shared/database/prisma-errors';
import { PrismaService } from '../../../shared/database/prisma.service';
import { GuideViewRepository } from '../domain/guide-view.repository';

@Injectable()
export class PrismaGuideViewRepository implements GuideViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async track(guideId: string): Promise<'tracked' | 'guide-not-found'> {
    const guide = await this.prisma.guide.findUnique({
      where: { id: guideId },
      select: { id: true },
    });
    if (!guide) return 'guide-not-found';

    try {
      await this.prisma.guideView.create({ data: { guideId } });
      return 'tracked';
    } catch (error) {
      if (isPrismaError(error, 'P2003')) return 'guide-not-found';
      throw error;
    }
  }
}
