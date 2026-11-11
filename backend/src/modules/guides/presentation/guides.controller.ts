import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Authorize } from '../../auth/presentation/authorize.decorator';
import { CreateGuideUseCase } from '../application/create-guide.use-case';
import { DeleteGuideUseCase } from '../application/delete-guide.use-case';
import { GetGuideFileUseCase } from '../application/get-guide-file.use-case';
import { GetGuideUseCase } from '../application/get-guide.use-case';
import { GuideFileInput } from '../application/guide-input';
import { ListGuidesUseCase } from '../application/list-guides.use-case';
import { ListManagedGuidesUseCase } from '../application/list-managed-guides.use-case';
import { SetGuidePublicationUseCase } from '../application/set-guide-publication.use-case';
import { UpdateGuideUseCase } from '../application/update-guide.use-case';
import { GUIDE_FILE_MAX_BYTES } from '../domain/guide';
import {
  CreateGuideDto,
  GuidePageResponseDto,
  GuideResponseDto,
  ListGuidesQueryDto,
  ListManagedGuidesQueryDto,
  SetGuidePublicationDto,
  toGuidePageResponse,
  toGuideResponse,
  UpdateGuideDto,
} from './dto/guide.dto';

interface UploadedPdf {
  originalname: string;
  buffer: Buffer;
}

const pdfUpload = () =>
  FileInterceptor('file', {
    limits: { fileSize: GUIDE_FILE_MAX_BYTES, files: 1 },
  });

function toFileInput(file?: UploadedPdf): GuideFileInput | undefined {
  return file
    ? {
        // Multer reads multipart file names as latin1; restore the UTF-8 name.
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        content: file.buffer,
      }
    : undefined;
}

function toStreamableFile(file: {
  fileName: string;
  contentType: string;
  content: Uint8Array;
}): StreamableFile {
  return new StreamableFile(file.content, {
    type: file.contentType,
    disposition: `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    length: file.content.length,
  });
}

const createBody = {
  schema: {
    type: 'object',
    required: ['title', 'categoryId', 'file'],
    properties: {
      title: { type: 'string', maxLength: 120 },
      categoryId: { type: 'string', format: 'uuid' },
      file: { type: 'string', format: 'binary', description: 'PDF, max 10 MB' },
    },
  },
};

const updateBody = {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', maxLength: 120 },
      categoryId: { type: 'string', format: 'uuid' },
      file: {
        type: 'string',
        format: 'binary',
        description: 'New PDF (replaces the current one), max 10 MB',
      },
    },
  },
};

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(
    private readonly createGuide: CreateGuideUseCase,
    private readonly listGuides: ListGuidesUseCase,
    private readonly listManagedGuides: ListManagedGuidesUseCase,
    private readonly setPublication: SetGuidePublicationUseCase,
    private readonly getGuide: GetGuideUseCase,
    private readonly getGuideFile: GetGuideFileUseCase,
    private readonly updateGuide: UpdateGuideUseCase,
    private readonly deleteGuide: DeleteGuideUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List guides',
    description:
      'Public. Paginated, newest first by default, optionally filtered by category and by part of the title (search).',
  })
  @ApiOkResponse({ type: GuidePageResponseDto })
  async list(
    @Query() query: ListGuidesQueryDto,
  ): Promise<GuidePageResponseDto> {
    return toGuidePageResponse(await this.listGuides.execute(query));
  }

  // The "manage" routes come before ":id" so that "manage" is not read as an id.
  @Get('manage')
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'List every guide, drafts included (staff or admin)',
    description:
      'Paginated, newest first by default. Filters: categoryId, search (part of the title) and publicationState.',
  })
  @ApiOkResponse({ type: GuidePageResponseDto })
  async listForStaff(
    @Query() query: ListManagedGuidesQueryDto,
  ): Promise<GuidePageResponseDto> {
    return toGuidePageResponse(await this.listManagedGuides.execute(query));
  }

  @Get('manage/:id')
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'Get one guide in any state (staff or admin)' })
  @ApiOkResponse({ type: GuideResponseDto })
  @ApiNotFoundResponse({ description: 'Guide not found' })
  async getForStaff(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<GuideResponseDto> {
    return toGuideResponse(
      await this.getGuide.execute(id, { includeUnpublished: true }),
    );
  }

  @Get('manage/:id/file')
  @Authorize('STAFF', 'ADMIN')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({
    summary: 'Open the PDF of a guide in any state (staff or admin)',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'The PDF document' })
  @ApiNotFoundResponse({ description: 'Guide not found or without PDF' })
  async fileForStaff(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StreamableFile> {
    return toStreamableFile(
      await this.getGuideFile.execute(id, { includeUnpublished: true }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one published guide' })
  @ApiOkResponse({ type: GuideResponseDto })
  @ApiNotFoundResponse({ description: 'Guide not found' })
  async get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<GuideResponseDto> {
    return toGuideResponse(await this.getGuide.execute(id));
  }

  @Get(':id/file')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Open or download the guide PDF' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'The PDF document' })
  @ApiNotFoundResponse({ description: 'Guide not found or without PDF' })
  async file(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StreamableFile> {
    return toStreamableFile(await this.getGuideFile.execute(id));
  }

  @Post()
  @Authorize('STAFF', 'ADMIN')
  @UseInterceptors(pdfUpload())
  @ApiOperation({ summary: 'Create a guide with its PDF (staff or admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(createBody)
  @ApiCreatedResponse({ type: GuideResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async create(
    @Body() body: CreateGuideDto,
    @UploadedFile() file?: UploadedPdf,
  ): Promise<GuideResponseDto> {
    return toGuideResponse(
      await this.createGuide.execute({
        title: body.title,
        categoryId: body.categoryId,
        file: toFileInput(file),
      }),
    );
  }

  @Patch(':id')
  @Authorize('STAFF', 'ADMIN')
  @UseInterceptors(pdfUpload())
  @ApiOperation({
    summary: 'Edit a guide (staff or admin)',
    description:
      'Send only the fields to change. A new PDF replaces the old one.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(updateBody)
  @ApiOkResponse({ type: GuideResponseDto })
  @ApiNotFoundResponse({ description: 'Guide or category not found' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateGuideDto,
    @UploadedFile() file?: UploadedPdf,
  ): Promise<GuideResponseDto> {
    return toGuideResponse(
      await this.updateGuide.execute({
        id,
        title: body.title,
        categoryId: body.categoryId,
        file: toFileInput(file),
      }),
    );
  }

  @Patch(':id/publication')
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'Publish or unpublish a guide (staff or admin)',
    description:
      'published=true makes the guide visible in the public catalog; published=false hides it again.',
  })
  @ApiOkResponse({ type: GuideResponseDto })
  @ApiNotFoundResponse({ description: 'Guide not found' })
  async publication(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: SetGuidePublicationDto,
  ): Promise<GuideResponseDto> {
    return toGuideResponse(
      await this.setPublication.execute({ id, published: body.published }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'Delete a guide with its PDF (staff or admin)' })
  @ApiNoContentResponse({ description: 'Guide deleted' })
  @ApiNotFoundResponse({ description: 'Guide not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.deleteGuide.execute(id);
  }
}
