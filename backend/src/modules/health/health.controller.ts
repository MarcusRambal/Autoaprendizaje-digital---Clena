import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    schema: {
      example: { status: 'ok' },
      properties: { status: { type: 'string', example: 'ok' } },
      type: 'object',
    },
  })
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
