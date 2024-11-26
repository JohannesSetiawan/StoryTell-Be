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
  UnauthorizedException,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { StoryCommentService } from './story.comment.service';
import { StoryCommentDto } from './story.comment.dto';

@Controller('storyComment')
export class StoryCommentController {
  constructor(private readonly storyCommentService: StoryCommentService) {}

  @UseGuards(JwtGuard)
  @Post('/:storyId')
  async createStoryComment(
    @Param() param,
    @Body() createCommentData: StoryCommentDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.userId;
      const storyId = param.storyId;

      if (!authorId) {
        throw new UnauthorizedException('You are not authenticated yet!');
      }

      const comment = await this.storyCommentService.createStoryComment(
        createCommentData,
        authorId,
        storyId,
      );
      return response.status(201).json(comment);
  }

  @UseGuards(JwtGuard)
  @Post('/:storyId/:chapterId')
  async createChapterComment(
    @Param() param,
    @Body() createCommentData: StoryCommentDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.userId;
      const storyId = param.storyId;
      const chapterId = param.chapterId;

      if (!authorId) {
        throw new UnauthorizedException('You are not authenticated yet!');
      }

      const comment = await this.storyCommentService.createChapterComment(
        createCommentData,
        authorId,
        storyId,
        chapterId
      );
      return response.status(201).json(comment);
  }

  @Get('/:storyId')
  async getAllCommentForStory(@Res() response, @Param() param) {
      const storyId = param.storyId;
      const comments =
        await this.storyCommentService.getAllStoryCommentForStory(storyId);
      return response.status(200).json(comments);
    
  }

  @Get('/:storyId/:id')
  async getSpecificComment(@Param() param, @Res() response) {
      const chapter = await this.storyCommentService.getSpecificCommentForStory(
        param.id,
      );
      return response.status(200).json(chapter);
    
  }

  @UseGuards(JwtGuard)
  @Put('/:storyId/:id')
  async updateComment(
    @Param() param,
    @Body() data: StoryCommentDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.userId;
      const storyId = param.storyId;
      const updatedComment = await this.storyCommentService.updateComment(
        param.id,
        authorId,
        storyId,
        data,
      );
      return response.status(200).json(updatedComment);
    
  }

  @UseGuards(JwtGuard)
  @Delete('/:storyId/:id')
  async deleteChapter(@Param() param, @Req() request, @Res() response) {
      const authorId = request.user.userId;
      await this.storyCommentService.deleteComment(
        param.id,
        authorId,
        param.storyId,
      );
      return response.status(200).json({ message: 'Deleted successfully!' });
  }
}
