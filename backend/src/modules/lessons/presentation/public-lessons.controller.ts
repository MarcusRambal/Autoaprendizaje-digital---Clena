import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListLessonsUseCase } from '../application/list-lessons.use-case';
import {
  LessonPageResponseDto,
  ListLessonsQueryDto,
  toLessonPageResponse,
} from './dto/lesson.dto';

@ApiTags('lessons')
@Controller('public/lessons')
export class PublicLessonsController {
  constructor(private readonly listLessons: ListLessonsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'List published lessons for learners',
    description:
      'Public, paginated, newest first. Draft and archived lessons are excluded.',
  })
  @ApiOkResponse({ type: LessonPageResponseDto })
  async list(
    @Query() query: ListLessonsQueryDto,
  ): Promise<LessonPageResponseDto> {
    return toLessonPageResponse(
      await this.listLessons.execute({
        ...query,
        publicationState: 'PUBLISHED',
      }),
    );
  }
}
