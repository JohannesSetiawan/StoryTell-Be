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
import { StoryService } from './story.service';
import { StoryDto } from './story.dto';
import { JwtGuard } from 'src/user/jwt.guard';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @UseGuards(JwtGuard)
  @Post('')
  async createStory(
    @Body() createStoryData: StoryDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.userId;
      if (!authorId) {
        throw new UnauthorizedException('You are not authenticated yet!');
      }
      createStoryData.authorId = authorId;
      const story = await this.storyService.createStory(createStoryData);
      return response.status(201).json(story);
  }

  @Get('')
  async getAllStories(@Res() response) {
      const stories = await this.storyService.getAllStories();
      return response.status(200).json(stories);
  }

  @UseGuards(JwtGuard)
  @Get('/:id')
  async getStory(@Param() param, @Req() request, @Res() response) {
      const readUserId = request.user.userId
      const story = await this.storyService.getSpecificStory(param.id, readUserId);
      return response.status(200).json(story);
  }

  @Get('/user/:userId')
  async getUserSpecificStory(@Res() response, @Param() param) {
      const story = await this.storyService.getSpecificUserStories(
        param.userId,
      );
      return response.status(200).json(story);
  }

  @UseGuards(JwtGuard)
  @Put('/:id')
  async updateStory(
    @Param() param,
    @Body() data: StoryDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.userId;
      const updateStory = await this.storyService.updateStory(
        param.id,
        authorId,
        data,
      );
      return response.status(200).json(updateStory);
  }

  @UseGuards(JwtGuard)
  @Delete('/:id')
  async deleteStory(@Param() param, @Req() request, @Res() response) {
      const authorId = request.user.userId;
      await this.storyService.deleteStory(param.id, authorId);
      return response.status(200).json({ message: 'Deleted successfully!' });
  
  }
}
