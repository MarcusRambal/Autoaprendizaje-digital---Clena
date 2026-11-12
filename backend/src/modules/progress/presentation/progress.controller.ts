import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../auth/presentation/roles.guard';
import { Authorize } from '../../auth/presentation/authorize.decorator';
import { CompleteLessonProgressUseCase } from '../application/complete-lesson-progress.use-case';
import { GetMyProgressUseCase } from '../application/get-my-progress.use-case';
import { TrackGuideProgressUseCase } from '../application/track-guide-progress.use-case';
import {
  MyProgressResponseDto,
  toMyProgressResponse,
} from './dto/progress-response.dto';

interface CurrentUser {
  id: string;
}

@ApiTags('progress')
@Controller('progress')
@Authorize('PUBLIC_USER')
export class ProgressController {
  constructor(
    private readonly getMyProgress: GetMyProgressUseCase,
    private readonly trackGuideProgress: TrackGuideProgressUseCase,
    private readonly completeLessonProgress: CompleteLessonProgressUseCase,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get the authenticated public user learning progress',
  })
  @ApiOkResponse({ type: MyProgressResponseDto })
  async getMine(
    @AuthenticatedUser() user: CurrentUser,
  ): Promise<MyProgressResponseDto> {
    return toMyProgressResponse(await this.getMyProgress.execute(user.id));
  }

  @Post('guides/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a guide as read by the authenticated user' })
  @ApiNoContentResponse({ description: 'Guide progress recorded' })
  @ApiNotFoundResponse({ description: 'Published guide not found' })
  async markGuideRead(
    @AuthenticatedUser() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) guideId: string,
  ): Promise<void> {
    await this.trackGuideProgress.execute(user.id, guideId);
  }

  @Post('lessons/:id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Record a lesson as complete for the authenticated user',
  })
  @ApiNoContentResponse({ description: 'Lesson progress recorded' })
  @ApiNotFoundResponse({ description: 'Published lesson not found' })
  async markLessonComplete(
    @AuthenticatedUser() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) lessonId: string,
  ): Promise<void> {
    await this.completeLessonProgress.execute(user.id, lessonId);
  }
}
