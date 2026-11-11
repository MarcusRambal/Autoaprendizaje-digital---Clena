import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isPrismaError } from '../../../shared/database/prisma-errors';
import { PrismaService } from '../../../shared/database/prisma.service';
import { HelpRequest } from '../domain/help-request';
import {
  ChangeStatusInput,
  ChangeStatusResult,
  HelpRequestPage,
  HelpRequestRepository,
  ListHelpRequestsQuery,
  NewHelpRequest,
} from '../domain/help-request.repository';

// The requester email is shown to the staff next to the request.
const helpRequestInclude = {
  requester: { select: { email: true } },
} satisfies Prisma.HelpRequestInclude;

type HelpRequestRow = Prisma.HelpRequestGetPayload<{
  include: typeof helpRequestInclude;
}>;

@Injectable()
export class PrismaHelpRequestRepository implements HelpRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NewHelpRequest): Promise<HelpRequest> {
    const row = await this.prisma.helpRequest.create({
      data: {
        requesterId: input.requesterId,
        requesterName: input.requesterName,
        topic: input.topic,
        description: input.description,
      },
      include: helpRequestInclude,
    });
    return this.toHelpRequest(row);
  }

  async list(query: ListHelpRequestsQuery): Promise<HelpRequestPage> {
    const where: Prisma.HelpRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.requesterId ? { requesterId: query.requesterId } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.helpRequest.count({ where }),
      this.prisma.helpRequest.findMany({
        where,
        include: helpRequestInclude,
        // `id` breaks ties so pages never repeat or skip rows.
        orderBy: [{ createdAt: query.order }, { id: query.order }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { items: rows.map((row) => this.toHelpRequest(row)), total };
  }

  async findById(id: string): Promise<HelpRequest | null> {
    const row = await this.prisma.helpRequest.findUnique({
      where: { id },
      include: helpRequestInclude,
    });
    return row ? this.toHelpRequest(row) : null;
  }

  async changeStatus(input: ChangeStatusInput): Promise<ChangeStatusResult> {
    const attended = input.status === 'ATTENDED';
    try {
      const row = await this.prisma.helpRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          attendedById: attended ? input.changedById : null,
          attendedAt: attended ? input.changedAt : null,
        },
        include: helpRequestInclude,
      });
      return { kind: 'updated', helpRequest: this.toHelpRequest(row) };
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return { kind: 'not-found' };
      }
      throw error;
    }
  }

  async delete(id: string): Promise<'deleted' | 'not-found'> {
    try {
      await this.prisma.helpRequest.delete({ where: { id } });
      return 'deleted';
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        return 'not-found';
      }
      throw error;
    }
  }

  private toHelpRequest(row: HelpRequestRow): HelpRequest {
    return {
      id: row.id,
      requesterName: row.requesterName,
      requesterEmail: row.requester?.email ?? null,
      topic: row.topic,
      description: row.description,
      status: row.status,
      attendedById: row.attendedById,
      attendedAt: row.attendedAt,
      createdAt: row.createdAt,
    };
  }
}
