import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Authorize } from '../../auth/presentation/authorize.decorator';
import { CreateLessonUseCase } from '../application/create-lesson.use-case';
import { DeleteLessonUseCase } from '../application/delete-lesson.use-case';
import { ListLessonsUseCase } from '../application/list-lessons.use-case';
import { UpdateLessonUseCase } from '../application/update-lesson.use-case';
import {
  LessonContentDto,
  LessonPageResponseDto,
  LessonResponseDto,
  ListLessonsQueryDto,
  toLessonPageResponse,
  toLessonResponse,
} from './dto/lesson.dto';

@ApiTags('lessons')
@Controller('lessons')
@Authorize('STAFF', 'ADMIN')
export class LessonsController {
  constructor(
    private readonly createLesson: CreateLessonUseCase,
    private readonly listLessons: ListLessonsUseCase,
    private readonly updateLesson: UpdateLessonUseCase,
    private readonly deleteLesson: DeleteLessonUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List lessons for staff' })
  @ApiOkResponse({ type: LessonPageResponseDto })
  async list(
    @Query() query: ListLessonsQueryDto,
  ): Promise<LessonPageResponseDto> {
    return toLessonPageResponse(await this.listLessons.execute(query));
  }

  @Post()
  @ApiOperation({ summary: 'Create a lesson (staff or admin)' })
  @ApiCreatedResponse({ type: LessonResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async create(@Body() body: LessonContentDto): Promise<LessonResponseDto> {
    return toLessonResponse(
      await this.createLesson.execute({
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        questions: body.questions,
      }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace a lesson (staff or admin)' })
  @ApiOkResponse({ type: LessonResponseDto })
  @ApiNotFoundResponse({ description: 'Lesson or category not found' })
  @ApiConflictResponse({
    description: 'Questions cannot change after learner progress exists',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: LessonContentDto,
  ): Promise<LessonResponseDto> {
    return toLessonResponse(
      await this.updateLesson.execute(id, {
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        questions: body.questions,
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson (staff or admin)' })
  @ApiNoContentResponse({ description: 'Lesson deleted' })
  @ApiNotFoundResponse({ description: 'Lesson not found' })
  @ApiConflictResponse({
    description: 'Lesson cannot be deleted while learner progress exists',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.deleteLesson.execute(id);
  }
}
