import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TrackGuideViewUseCase } from '../application/track-guide-view.use-case';
import { GuideViewThrottleGuard } from './guide-view-throttle.guard';

@ApiTags('guides')
@Controller('guides')
@UseGuards(GuideViewThrottleGuard)
export class GuideViewController {
  constructor(private readonly trackGuideView: TrackGuideViewUseCase) {}

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track a public guide view (limited per IP)',
  })
  @ApiNoContentResponse({ description: 'Guide view recorded' })
  @ApiNotFoundResponse({ description: 'Guide not found' })
  async track(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.trackGuideView.execute(id);
  }
}
