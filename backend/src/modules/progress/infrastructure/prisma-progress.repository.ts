import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  ProgressCounts,
  ProgressRepository,
  TrackProgressResult,
} from '../domain/progress.repository';

@Injectable()
export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCounts(userId: string): Promise<ProgressCounts> {
    const [totalGuides, readGuides, totalLessons, completedLessons] =
      await Promise.all([
        this.prisma.guide.count({
          where: { publicationState: 'PUBLISHED' },
        }),
        this.prisma.guideProgress.findMany({
          where: {
            userId,
            guide: { publicationState: 'PUBLISHED' },
          },
          select: { guideId: true },
        }),
        this.prisma.activity.count({
          where: { publicationState: 'PUBLISHED' },
        }),
        this.prisma.activityProgress.findMany({
          where: {
            userId,
            status: 'COMPLETED',
            activity: { publicationState: 'PUBLISHED' },
          },
          select: { activityId: true },
          distinct: ['activityId'],
        }),
      ]);

    return {
      completedGuides: readGuides.length,
      totalGuides,
      completedLessons: completedLessons.length,
      totalLessons,
    };
  }

  async markGuideRead(
    userId: string,
    guideId: string,
  ): Promise<TrackProgressResult> {
    const guide = await this.prisma.guide.findFirst({
      where: { id: guideId, publicationState: 'PUBLISHED' },
      select: { id: true },
    });
    if (!guide) return 'not-found';

    await this.prisma.guideProgress.upsert({
      where: { userId_guideId: { userId, guideId } },
      create: { userId, guideId },
      update: {},
    });
    return 'tracked';
  }

  async markLessonCompleted(
    userId: string,
    lessonId: string,
  ): Promise<TrackProgressResult> {
    const lesson = await this.prisma.activity.findFirst({
      where: { id: lessonId, publicationState: 'PUBLISHED' },
      select: { id: true },
    });
    if (!lesson) return 'not-found';

    await this.prisma.activityProgress.upsert({
      where: {
        userId_activityId_attemptNumber: {
          userId,
          activityId: lessonId,
          attemptNumber: 1,
        },
      },
      create: {
        userId,
        activityId: lessonId,
        attemptNumber: 1,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    return 'tracked';
  }
}
