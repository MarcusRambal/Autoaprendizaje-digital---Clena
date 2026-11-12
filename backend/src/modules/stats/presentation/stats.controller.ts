import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Authorize } from '../../auth/presentation/authorize.decorator';
import { GetStatisticsUseCase } from '../application/get-statistics.use-case';
import { StatsQueryDto } from './dto/stats-query.dto';
import {
  StatisticsResponseDto,
  toStatisticsResponse,
} from './dto/stats-response.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly getStatistics: GetStatisticsUseCase) {}

  @Get()
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'Get guide and help-request statistics' })
  @ApiOkResponse({ type: StatisticsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  async get(@Query() query: StatsQueryDto): Promise<StatisticsResponseDto> {
    return toStatisticsResponse(await this.getStatistics.execute(query));
  }
}
