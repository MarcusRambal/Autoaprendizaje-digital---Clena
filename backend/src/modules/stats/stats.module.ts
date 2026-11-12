import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../shared/database/database.module';
import { GetStatisticsUseCase } from './application/get-statistics.use-case';
import { TrackGuideViewUseCase } from './application/track-guide-view.use-case';
import { GuideViewRepository } from './domain/guide-view.repository';
import { StatsRepository } from './domain/stats.repository';
import { PrismaGuideViewRepository } from './infrastructure/prisma-guide-view.repository';
import { PrismaStatsRepository } from './infrastructure/prisma-stats.repository';
import { GuideViewController } from './presentation/guide-view.controller';
import { GuideViewThrottleGuard } from './presentation/guide-view-throttle.guard';
import { StatsController } from './presentation/stats.controller';

export const STATS_REPOSITORY = Symbol('STATS_REPOSITORY');
export const GUIDE_VIEW_REPOSITORY = Symbol('GUIDE_VIEW_REPOSITORY');

@Module({
  imports: [AuthModule, JwtModule.register({}), DatabaseModule],
  controllers: [StatsController, GuideViewController],
  providers: [
    PrismaStatsRepository,
    PrismaGuideViewRepository,
    { provide: STATS_REPOSITORY, useExisting: PrismaStatsRepository },
    { provide: GUIDE_VIEW_REPOSITORY, useExisting: PrismaGuideViewRepository },
    {
      provide: GetStatisticsUseCase,
      inject: [STATS_REPOSITORY],
      useFactory: (repository: StatsRepository) =>
        new GetStatisticsUseCase(repository),
    },
    {
      provide: TrackGuideViewUseCase,
      inject: [GUIDE_VIEW_REPOSITORY],
      useFactory: (repository: GuideViewRepository) =>
        new TrackGuideViewUseCase(repository),
    },
    GuideViewThrottleGuard,
  ],
})
export class StatsModule {}
