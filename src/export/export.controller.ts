import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ExportService } from './export.service';
import {
  ExportFormat,
  ExportQueryDto,
  EXPORT_FORMAT_OPTIONS,
  BackupQueryDto,
  BACKUP_SECTION_OPTIONS,
  BackupSection,
} from './export.dto';
import { JwtGuard } from '../user/jwt.guard';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('story/:storyId/:format')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export a story in a specific format' })
  @ApiParam({ name: 'storyId', description: 'Story ID to export', type: String })
  @ApiParam({
    name: 'format',
    description: 'Desired export format',
    enum: EXPORT_FORMAT_OPTIONS,
  })
  @ApiQuery({
    name: 'chapterIds',
    required: false,
    description:
      'Optional comma-separated list (or repeated query parameter) of chapter IDs to export. Defaults to all chapters.',
  })
  @ApiProduces('application/pdf', 'application/epub+zip', 'text/html', 'text/plain')
  async exportStory(
    @Param('storyId') storyId: string,
    @Param('format', new ParseEnumPipe(EXPORT_FORMAT_OPTIONS as any)) format: ExportFormat,
    @Query() query: ExportQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const chapterIds = this.parseChapterIds(query.chapterIds);
    const result = await this.exportService.exportStory(storyId, format, req.user.id, chapterIds);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  }

  @Get('backup')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Download the authenticated user's backup data" })
  @ApiProduces('application/zip')
  @ApiQuery({
    name: 'include',
    required: false,
    description:
      'Comma-separated list (or repeated query parameter) of dataset groups to include. Defaults to all.',
    enum: BACKUP_SECTION_OPTIONS,
    isArray: true,
  })
  async exportBackup(
    @Req() req: AuthenticatedRequest,
    @Query() query: BackupQueryDto,
    @Res() res: Response,
  ) {
    const sections = this.parseBackupSections(query.include);
    const result = await this.exportService.exportUserBackup(req.user.id, sections);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  }

  private parseChapterIds(value?: string | string[]): string[] | undefined {
    if (!value) {
      return undefined;
    }

    const normalize = (val: string) => val.split(',').map((item) => item.trim()).filter(Boolean);

    const parsed = Array.isArray(value)
      ? value.flatMap((item) => normalize(item))
      : normalize(value);

    return parsed.length > 0 ? parsed : undefined;
  }

  private parseBackupSections(value?: BackupSection[] | BackupSection | string): BackupSection[] | undefined {
    if (!value) {
      return undefined;
    }

    const normalize = (input: string) =>
      input
        .split(',')
        .map((item) => item.trim() as BackupSection)
        .filter((item) => BACKUP_SECTION_OPTIONS.includes(item));

    const parsed = Array.isArray(value)
      ? value.flatMap((item) => normalize(item as string))
      : normalize(value as string);

    return parsed.length > 0 ? Array.from(new Set(parsed)) : undefined;
  }
}
