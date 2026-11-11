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
import { GetHelpRequestUseCase } from '../application/get-help-request.use-case';
import { ListHelpRequestsUseCase } from '../application/list-help-requests.use-case';
import { ListMyHelpRequestsUseCase } from '../application/list-my-help-requests.use-case';
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
export class HelpRequestsController {
  constructor(
    private readonly createHelpRequest: CreateHelpRequestUseCase,
    private readonly listHelpRequests: ListHelpRequestsUseCase,
    private readonly listMyHelpRequests: ListMyHelpRequestsUseCase,
    private readonly getHelpRequest: GetHelpRequestUseCase,
    private readonly changeStatus: ChangeHelpRequestStatusUseCase,
    private readonly deleteHelpRequest: DeleteHelpRequestUseCase,
  ) {}

  @Post()
  @Authorize('PUBLIC_USER', 'STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'Register a help request',
    description:
      'A signed-in user asks the staff for in-person help with a name, a subject (topic) and a description; it is saved as PENDING and shows up in "my requests". When the staff registers it for someone at the desk, it is not linked to the staff account.',
  })
  @ApiCreatedResponse({ type: HelpRequestResponseDto })
  async create(
    @AuthenticatedUser() user: CurrentUser,
    @Body() body: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    return toHelpRequestResponse(
      await this.createHelpRequest.execute({
        requesterId: user.role === 'PUBLIC_USER' ? user.id : null,
        requesterName: body.requesterName,
        topic: body.topic,
        description: body.description,
      }),
    );
  }

  // "mine" comes before ":id" so that it is not read as an id.
  @Get('mine')
  @Authorize('PUBLIC_USER', 'STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'List my help requests',
    description:
      'Only the requests made by the signed-in account, newest first, with their status and date.',
  })
  @ApiOkResponse({ type: HelpRequestPageResponseDto })
  async listMine(
    @AuthenticatedUser() user: CurrentUser,
    @Query() query: ListHelpRequestsQueryDto,
  ): Promise<HelpRequestPageResponseDto> {
    return toHelpRequestPageResponse(
      await this.listMyHelpRequests.execute({
        ...query,
        requesterId: user.id,
      }),
    );
  }

  @Get()
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'List help requests',
    description:
      'Paginated, oldest first by default, optionally filtered by status, requester name or email, and date in Colombia.',
  })
  @ApiOkResponse({ type: HelpRequestPageResponseDto })
  async list(
    @Query() query: ListHelpRequestsQueryDto,
  ): Promise<HelpRequestPageResponseDto> {
    return toHelpRequestPageResponse(
      await this.listHelpRequests.execute(query),
    );
  }

  @Get(':id')
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'Get the detail of a help request (staff or admin)',
  })
  @ApiOkResponse({ type: HelpRequestResponseDto })
  @ApiNotFoundResponse({ description: 'Help request not found' })
  async get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<HelpRequestResponseDto> {
    return toHelpRequestResponse(await this.getHelpRequest.execute(id));
  }

  @Patch(':id')
  @Authorize('STAFF', 'ADMIN')
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
  @Authorize('STAFF', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a help request' })
  @ApiNoContentResponse({ description: 'Help request deleted' })
  @ApiNotFoundResponse({ description: 'Help request not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.deleteHelpRequest.execute(id);
  }
}
