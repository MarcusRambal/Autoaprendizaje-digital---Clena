import { ApiProperty } from '@nestjs/swagger';
import { Statistics } from '../../domain/statistics';

export class StatisticsRangeDto {
  @ApiProperty({ example: '2026-11-01', format: 'date' })
  from!: string;

  @ApiProperty({ example: '2026-11-13', format: 'date' })
  to!: string;
}

export class TopGuideDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  categoryTitle!: string;

  @ApiProperty({ minimum: 0 })
  views!: number;
}

export class TopCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ minimum: 0 })
  views!: number;
}

export class HelpRequestStatsDto {
  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0 })
  attended!: number;
}

export class StatisticsResponseDto {
  @ApiProperty({ type: StatisticsRangeDto })
  range!: StatisticsRangeDto;

  @ApiProperty({ type: [TopGuideDto] })
  topGuides!: TopGuideDto[];

  @ApiProperty({ type: [TopCategoryDto] })
  topCategories!: TopCategoryDto[];

  @ApiProperty({ type: HelpRequestStatsDto })
  helpRequests!: HelpRequestStatsDto;
}

export function toStatisticsResponse(
  statistics: Statistics,
): StatisticsResponseDto {
  return {
    range: statistics.range,
    topGuides: statistics.topGuides,
    topCategories: statistics.topCategories,
    helpRequests: statistics.helpRequests,
  };
}
