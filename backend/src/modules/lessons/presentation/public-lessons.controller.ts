import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckLessonAnswerUseCase } from '../application/check-lesson-answer.use-case';
import { GetPublicLessonUseCase } from '../application/get-public-lesson.use-case';
import { ListLessonsUseCase } from '../application/list-lessons.use-case';
import {
  CheckLessonAnswerDto,
  CheckLessonAnswerResponseDto,
  ListLessonsQueryDto,
  PublicLessonPageResponseDto,
  PublicLessonResponseDto,
  toPublicLessonPageResponse,
  toPublicLessonResponse,
} from './dto/lesson.dto';

@ApiTags('lessons')
@Controller()
export class PublicLessonsController {
  constructor(
    private readonly listLessons: ListLessonsUseCase,
    private readonly getPublicLesson: GetPublicLessonUseCase,
    private readonly checkLessonAnswer: CheckLessonAnswerUseCase,
  ) {}

  @Get('public/lessons')
  @ApiOperation({
    summary: 'List published lessons for learners',
    description:
      'Public, paginated, newest first. Draft and archived lessons are excluded.',
  })
  @ApiOkResponse({ type: PublicLessonPageResponseDto })
  async list(
    @Query() query: ListLessonsQueryDto,
  ): Promise<PublicLessonPageResponseDto> {
    return toPublicLessonPageResponse(
      await this.listLessons.execute({
        ...query,
        publicationState: 'PUBLISHED',
      }),
    );
  }

  @Get('lessons/:id/public')
  @ApiOperation({ summary: 'Get a published lesson without answer keys' })
  @ApiOkResponse({ type: PublicLessonResponseDto })
  @ApiNotFoundResponse({ description: 'Published lesson not found' })
  async getOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicLessonResponseDto> {
    return toPublicLessonResponse(await this.getPublicLesson.execute(id));
  }

  @Post('lessons/:id/check-answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check one answer for a published lesson' })
  @ApiOkResponse({ type: CheckLessonAnswerResponseDto })
  @ApiNotFoundResponse({
    description: 'Published lesson or question not found',
  })
  async checkAnswer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: CheckLessonAnswerDto,
  ): Promise<CheckLessonAnswerResponseDto> {
    return this.checkLessonAnswer.execute(id, body);
  }
}
