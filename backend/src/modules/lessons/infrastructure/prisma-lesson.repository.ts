import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { isPrismaError } from '../../../shared/database/prisma-errors';
import { PrismaService } from '../../../shared/database/prisma.service';
import { slugify } from '../../../shared/primitives/slug';
import {
  Lesson,
  LessonContentInput,
  LessonQuestionInput,
} from '../domain/lesson';
import {
  CreateLessonResult,
  DeleteLessonResult,
  LessonPage,
  LessonRepository,
  ListLessonsQuery,
  UpdateLessonResult,
} from '../domain/lesson.repository';

const lessonInclude = {
  category: { select: { id: true, name: true } },
  questions: { orderBy: { orderNumber: 'asc' } },
} satisfies Prisma.ActivityInclude;

type LessonRow = Prisma.ActivityGetPayload<{ include: typeof lessonInclude }>;

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: LessonContentInput): Promise<CreateLessonResult> {
    const baseSlug = slugify(input.title) || 'leccion';
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug =
        attempt === 0
          ? baseSlug
          : `${baseSlug}-${randomBytes(3).toString('hex')}`;
      try {
        const row = await this.prisma.activity.create({
          data: {
            title: input.title,
            slug,
            description: input.description,
            categoryId: input.categoryId,
            publicationState: 'PUBLISHED',
            questions: {
              create: this.toQuestionData(input.questions),
            },
          },
          include: lessonInclude,
        });
        return { kind: 'created', lesson: this.toLesson(row) };
      } catch (error) {
        if (isPrismaError(error, 'P2003')) {
          return { kind: 'category-not-found' };
        }
        if (!isPrismaError(error, 'P2002')) {
          throw error;
        }
      }
    }
    throw new Error('Could not generate a unique lesson slug');
  }

  async list(query: ListLessonsQuery): Promise<LessonPage> {
    const where: Prisma.ActivityWhereInput = query.publicationState
      ? { publicationState: query.publicationState }
      : {};
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        include: lessonInclude,
        orderBy: [{ createdAt: query.order }, { id: query.order }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { items: rows.map((row) => this.toLesson(row)), total };
  }

  async update(
    id: string,
    input: LessonContentInput,
  ): Promise<UpdateLessonResult> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.activity.findUnique({
          where: { id },
          include: lessonInclude,
        });
        if (!existing) {
          return { kind: 'not-found' as const };
        }

        const category = await transaction.category.findUnique({
          where: { id: input.categoryId },
          select: { id: true },
        });
        if (!category) {
          return { kind: 'category-not-found' as const };
        }

        const questionsChanged = !this.questionsMatch(
          existing.questions,
          input.questions,
        );
        if (questionsChanged) {
          const progressCount = await transaction.activityProgress.count({
            where: { activityId: id },
          });
          if (progressCount > 0) {
            return { kind: 'questions-locked' as const };
          }
        }

        await transaction.activity.update({
          where: { id },
          data: {
            title: input.title,
            description: input.description,
            categoryId: input.categoryId,
            ...(input.title !== existing.title
              ? { slug: this.makeUpdatedSlug(input.title) }
              : {}),
          },
        });

        if (questionsChanged) {
          await transaction.activityQuestion.deleteMany({
            where: { activityId: id },
          });
          await transaction.activityQuestion.createMany({
            data: this.toQuestionData(input.questions).map((question) => ({
              ...question,
              activityId: id,
            })),
          });
        }

        const row = await transaction.activity.findUnique({
          where: { id },
          include: lessonInclude,
        });
        if (!row) {
          return { kind: 'not-found' as const };
        }
        return { kind: 'updated' as const, lesson: this.toLesson(row) };
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      if (isPrismaError(error, 'P2003')) {
        return { kind: 'category-not-found' };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<DeleteLessonResult> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.activity.findUnique({
          where: { id },
          select: {
            _count: { select: { progress: true } },
          },
        });
        if (!existing) {
          return 'not-found' as const;
        }
        if (existing._count.progress > 0) {
          return 'has-progress' as const;
        }

        await transaction.activityQuestion.deleteMany({
          where: { activityId: id },
        });
        await transaction.activity.delete({ where: { id } });
        return 'deleted' as const;
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return 'not-found';
      }
      if (isPrismaError(error, 'P2003')) {
        return 'has-progress';
      }
      throw error;
    }
  }

  private makeUpdatedSlug(title: string): string {
    const baseSlug = slugify(title) || 'leccion';
    return `${baseSlug}-${randomBytes(3).toString('hex')}`;
  }

  private toQuestionData(questions: LessonQuestionInput[]) {
    return questions.map((question, index) => ({
      orderNumber: index + 1,
      prompt: question.prompt,
      choices: question.choices,
      expectedAnswer: question.choices[question.correctOptionIndex],
      immediateFeedback: question.immediateFeedback,
    }));
  }

  private questionsMatch(
    existing: LessonRow['questions'],
    input: LessonQuestionInput[],
  ): boolean {
    return (
      existing.length === input.length &&
      existing.every((question, index) => {
        const next = input[index];
        return (
          question.orderNumber === index + 1 &&
          question.prompt === next.prompt &&
          question.choices.length === next.choices.length &&
          question.choices.every(
            (choice, choiceIndex) => choice === next.choices[choiceIndex],
          ) &&
          question.expectedAnswer === next.choices[next.correctOptionIndex] &&
          question.immediateFeedback === next.immediateFeedback
        );
      })
    );
  }

  private toLesson(row: LessonRow): Lesson {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category?.id ?? null,
      categoryTitle: row.category?.name ?? null,
      publicationState: row.publicationState,
      questions: row.questions.map((question) => ({
        id: question.id,
        orderNumber: question.orderNumber,
        prompt: question.prompt,
        choices: question.choices,
        correctOptionIndex: question.choices.indexOf(question.expectedAnswer),
        immediateFeedback: question.immediateFeedback,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
