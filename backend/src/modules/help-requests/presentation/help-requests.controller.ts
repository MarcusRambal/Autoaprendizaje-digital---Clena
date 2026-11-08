import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUserRole } from '../../auth/domain/auth-user';
import { Authorize } from '../../auth/presentation/authorize.decorator';
import { AuthenticatedUser } from '../../auth/presentation/roles.guard';
import { ChangeHelpRequestStatusUseCase } from '../application/change-help-request-status.use-case';
import { CreateHelpRequestUseCase } from '../application/create-help-request.use-case';
import { DeleteHelpRequestUseCase } from '../application/delete-help-request.use-case';
import { ListHelpRequestsUseCase } from '../application/list-help-requests.use-case';
import {
  ChangeHelpRequestStatusDto,
  CreateHelpRequestDto,
  HelpRequestPageResponseDto,
  HelpRequestResponseDto,
  ListHelpRequestsQueryDto,
  toHelpRequestPageResponse,
  toHelpRequestResponse,
} from './dto/help-request.dto';

interface CurrentUser {
  id: string;
  email: string;
  role: AuthUserRole;
}

@ApiTags('help-requests')
@Controller('help-requests')
@Authorize('STAFF', 'ADMIN')
export class HelpRequestsController {
  constructor(
    private readonly createHelpRequest: CreateHelpRequestUseCase,
    private readonly listHelpRequests: ListHelpRequestsUseCase,
    private readonly changeStatus: ChangeHelpRequestStatusUseCase,
    private readonly deleteHelpRequest: DeleteHelpRequestUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Register an in-person help request',
    description: 'The staff writes the name of the person and the help topic.',
  })
  @ApiCreatedResponse({ type: HelpRequestResponseDto })
  async create(
    @Body() body: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    return toHelpRequestResponse(
      await this.createHelpRequest.execute({
        requesterName: body.requesterName,
        topic: body.topic,
      }),
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List help requests',
    description:
      'Paginated, oldest first by default, optionally filtered by status.',
  })
  @ApiOkResponse({ type: HelpRequestPageResponseDto })
  async list(
    @Query() query: ListHelpRequestsQueryDto,
  ): Promise<HelpRequestPageResponseDto> {
    return toHelpRequestPageResponse(
      await this.listHelpRequests.execute(query),
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Change the status of a help request',
    description:
      'Marking a request as ATTENDED records who attended it and when.',
  })
  @ApiOkResponse({ type: HelpRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Help request not found' })
  async update(
    @AuthenticatedUser() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ChangeHelpRequestStatusDto,
  ): Promise<HelpRequestResponseDto> {
    return toHelpRequestResponse(
      await this.changeStatus.execute({
        id,
        status: body.status,
        changedById: user.id,
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a help request' })
  @ApiNoContentResponse({ description: 'Help request deleted' })
  @ApiNotFoundResponse({ description: 'Help request not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.deleteHelpRequest.execute(id);
  }
}
