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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { CreateUserUseCase } from '../application/create-user.use-case';
import { DeleteUserAccountUseCase } from '../application/delete-user-account.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import {
  CreateUserDto,
  CreateUserResponseDto,
  toCreateUserResponse,
} from './dto/create-user.dto';
import {
  ListUsersQueryDto,
  toUserPageResponse,
  UserPageResponseDto,
} from './dto/user.dto';

interface CurrentUser {
  id: string;
  email: string;
  role: AuthUserRole;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly deleteAccount: DeleteUserAccountUseCase,
    private readonly createUser: CreateUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Authorize('ADMIN')
  @ApiOperation({ summary: 'Create a staff or public user account (admin)' })
  @ApiCreatedResponse({ type: CreateUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user input' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async create(@Body() body: CreateUserDto): Promise<CreateUserResponseDto> {
    return toCreateUserResponse(await this.createUser.execute(body));
  }

  @Get()
  @Authorize('ADMIN')
  @ApiOperation({
    summary: 'List user accounts (admin)',
    description:
      'Paginated, alphabetical by email by default. Optional filters: search (part of the email) and role. Never returns credentials.',
  })
  @ApiOkResponse({ type: UserPageResponseDto })
  async list(@Query() query: ListUsersQueryDto): Promise<UserPageResponseDto> {
    return toUserPageResponse(await this.listUsers.execute(query));
  }

  // Declared before ':id' so "me" is not parsed as a UUID.
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize()
  @ApiOperation({
    summary: 'Delete my account and all my personal data',
    description:
      'Right to erasure (Ley 1581 de 2012). Removes the account, its sessions, learning progress and help requests. Administrator accounts cannot be deleted.',
  })
  @ApiNoContentResponse({ description: 'Account deleted' })
  @ApiConflictResponse({ description: 'Administrator accounts are protected' })
  async deleteMine(@AuthenticatedUser() user: CurrentUser): Promise<void> {
    await this.deleteAccount.execute(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize('ADMIN')
  @ApiOperation({
    summary: "Delete a user's account and all their personal data (admin)",
    description:
      'For when a person asks the CLENA to erase their data. Administrator accounts cannot be deleted.',
  })
  @ApiNoContentResponse({ description: 'Account deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Administrator accounts are protected' })
  async deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.deleteAccount.execute(id);
  }
}
