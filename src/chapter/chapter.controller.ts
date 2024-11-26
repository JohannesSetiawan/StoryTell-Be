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
import { ChapterDto } from './chapter.dto';

@Controller('chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @UseGuards(JwtGuard)
  @Post('')
  async createChapter(
    @Body() createChapterData: ChapterDto,
    @Req() request,
    @Res() response,
  ) {
    const authorId = request.user.userId;

    if (!authorId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }

    const chapter = await this.chapterService.createChapter(
      createChapterData,
      authorId,
    );
    return response.status(201).json(chapter);
  }

  @Get('')
  async getAllChaptersForStory(
    @Res() response,
    @Query('storyId') storyId: string,
  ) {
    const chapters = await this.chapterService.getAllChapterForStory(storyId);
      return response.status(200).json(chapters);
  }

  @Get('/:id')
  async getChapter(@Param() param, @Res() response) {
    const chapter = await this.chapterService.getSpecificChapter(param.id);
      return response.status(200).json(chapter);
  }

  @UseGuards(JwtGuard)
  @Put('/:id')
  async updateChapter(
    @Param() param,
    @Body() data: ChapterDto,
    @Req() request,
    @Res() response,
  ) {
    const authorId = request.user.userId;
    const updatedChapter = await this.chapterService.updateChapter(
      param.id,
      authorId,
      data,
    );
    return response.status(200).json(updatedChapter);
  }

  @UseGuards(JwtGuard)
  @Delete('/:id')
  async deleteChapter(@Param() param, @Req() request, @Res() response) {
    const authorId = request.user.userId;
    await this.chapterService.deleteChapter(param.id, authorId);
    return response.status(200).json({ message: 'Deleted successfully!' });
  }
}
