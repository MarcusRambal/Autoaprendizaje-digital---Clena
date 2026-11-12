import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  ProgressActivities,
  ProgressRepository,
  TrackProgressResult,
} from '../domain/progress.repository';

@Injectable()
export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActivities(userId: string): Promise<ProgressActivities> {
    const [guides, lessons] = await Promise.all([
      this.prisma.guide.findMany({
        where: { publicationState: 'PUBLISHED' },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          progress: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
        },
      }),
      this.prisma.activity.findMany({
        where: { publicationState: 'PUBLISHED' },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          progress: {
            where: { userId, status: 'COMPLETED' },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);
    return {
      guides: guides.map(({ id, title, progress }) => ({
        id,
        title,
        completed: progress.length > 0,
      })),
      lessons: lessons.map(({ id, title, progress }) => ({
        id,
        title,
        completed: progress.length > 0,
      })),
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
