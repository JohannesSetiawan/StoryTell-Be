import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Put,
  Delete,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { ChapterService } from './chapter.service';
import { ChapterDto, Chapter } from './chapter.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('chapter')
@Controller('chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('')
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiBody({ type: ChapterDto })
  @ApiResponse({ status: 201, description: 'The chapter has been successfully created.', type: Chapter })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createChapter(
    @Body() createChapterData: ChapterDto,
    @Req() request,
    @Res() response,
  ) {
    const authorId = request.user.id;

    if (!authorId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }

    const chapter = await this.chapterService.createChapter(
      createChapterData,
      authorId,
    );
    return response.status(201).json(chapter);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('')
  @ApiOperation({ summary: 'Get all chapters for a story' })
  @ApiQuery({ name: 'storyId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'The chapters have been successfully retrieved.', type: [Chapter] })
  async getAllChaptersForStory(
    @Res() response,
    @Query('storyId') storyId: string,
  ) {
    const chapters = await this.chapterService.getAllChapterForStory(storyId);
      return response.status(200).json(chapters);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/:id')
  @ApiOperation({ summary: 'Get a specific chapter' })
  @ApiParam({ name: 'id', description: 'The ID of the chapter', type: String })
  @ApiResponse({ status: 200, description: 'The chapter has been successfully retrieved.', type: Chapter })
  async getChapter(@Param() param, @Req() request, @Res() response) {
    const readUserId = request.user.id;
    const chapter = await this.chapterService.getSpecificChapter(param.id, readUserId);
    return response.status(200).json(chapter);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Put('/:id')
  @ApiOperation({ summary: 'Update a chapter' })
  @ApiParam({ name: 'id', description: 'The ID of the chapter to update', type: String })
  @ApiBody({ type: ChapterDto })
  @ApiResponse({ status: 200, description: 'The chapter has been successfully updated.', type: Chapter })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateChapter(
    @Param() param,
    @Body() data: Partial<ChapterDto>,
    @Req() request,
    @Res() response,
  ) {
    const authorId = request.user.id;
    const updatedChapter = await this.chapterService.updateChapter(
      param.id,
      authorId,
      data,
    );
    return response.status(200).json(updatedChapter);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a chapter' })
  @ApiParam({ name: 'id', description: 'The ID of the chapter to delete', type: String })
  @ApiResponse({ status: 200, description: 'The chapter has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteChapter(@Param() param, @Req() request, @Res() response) {
    const authorId = request.user.id;
    await this.chapterService.deleteChapter(param.id, authorId);
    return response.status(200).json({ message: 'Deleted successfully!' });
  }
}
