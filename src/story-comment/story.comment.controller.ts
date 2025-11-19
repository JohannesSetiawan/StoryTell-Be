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
import { StoryCommentDto, StoryComment } from './story.comment.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('story-comment')
@Controller('storyComment')
export class StoryCommentController {
  constructor(private readonly storyCommentService: StoryCommentService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('/:storyId')
  @ApiOperation({ summary: 'Create a new comment for a story' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story to comment on', type: String })
  @ApiBody({ type: StoryCommentDto })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.', type: StoryComment })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createStoryComment(
    @Param() param,
    @Body() createCommentData: StoryCommentDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.id;
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
  @ApiBearerAuth()
  @Post('/:storyId/:chapterId')
  @ApiOperation({ summary: 'Create a new comment for a chapter' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiParam({ name: 'chapterId', description: 'The ID of the chapter to comment on', type: String })
  @ApiBody({ type: StoryCommentDto })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.', type: StoryComment })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createChapterComment(
    @Param() param,
    @Body() createCommentData: StoryCommentDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.id;
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
  @ApiOperation({ summary: 'Get all comments for a story' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'The comments have been successfully retrieved.', type: [StoryComment] })
  async getAllCommentForStory(@Res() response, @Param() param) {
      const storyId = param.storyId;
      const comments =
        await this.storyCommentService.getAllStoryCommentForStory(storyId);
      return response.status(200).json(comments);
    
  }

  @Get('/:storyId/paginated')
  @ApiOperation({ summary: 'Get paginated comments for a story' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'The paginated comments have been successfully retrieved.' })
  async getPaginatedStoryComments(
    @Res() response,
    @Param('storyId') storyId: string,
    @Req() request
  ) {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const result = await this.storyCommentService.getPaginatedStoryComments(storyId, page, limit);
    return response.status(200).json(result);
  }

  @Get('/:storyId/:chapterId/paginated')
  @ApiOperation({ summary: 'Get paginated comments for a chapter' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiParam({ name: 'chapterId', description: 'The ID of the chapter', type: String })
  @ApiResponse({ status: 200, description: 'The paginated comments have been successfully retrieved.' })
  async getPaginatedChapterComments(
    @Res() response,
    @Param('storyId') storyId: string,
    @Param('chapterId') chapterId: string,
    @Req() request
  ) {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const result = await this.storyCommentService.getPaginatedChapterComments(storyId, chapterId, page, limit);
    return response.status(200).json(result);
  }

  @Get('/:storyId/:id')
  @ApiOperation({ summary: 'Get a specific comment' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiParam({ name: 'id', description: 'The ID of the comment', type: String })
  @ApiResponse({ status: 200, description: 'The comment has been successfully retrieved.', type: StoryComment })
  async getSpecificComment(@Param() param, @Res() response) {
      const chapter = await this.storyCommentService.getSpecificCommentForStory(
        param.id,
      );
      return response.status(200).json(chapter);
    
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Put('/:storyId/:id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiParam({ name: 'id', description: 'The ID of the comment to update', type: String })
  @ApiBody({ type: StoryCommentDto })
  @ApiResponse({ status: 200, description: 'The comment has been successfully updated.', type: StoryComment })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateComment(
    @Param() param,
    @Body() data: StoryCommentDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.id;
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
  @ApiBearerAuth()
  @Delete('/:storyId/:id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiParam({ name: 'id', description: 'The ID of the comment to delete', type: String })
  @ApiResponse({ status: 200, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteChapter(@Param() param, @Req() request, @Res() response) {
      const authorId = request.user.id;
      await this.storyCommentService.deleteComment(
        param.id,
        authorId,
        param.storyId,
      );
      return response.status(200).json({ message: 'Deleted successfully!' });
  }
}
