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
import { StoryService } from './story.service';
import { StoryDto, Story, PaginatedStoryResponseDto } from './story.dto';
import { JwtGuard } from 'src/user/jwt.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('story')
@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('')
  @ApiOperation({ summary: 'Create a new story' })
  @ApiBody({ type: StoryDto })
  @ApiResponse({ status: 201, description: 'The story has been successfully created.', type: Story })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createStory(
    @Body() createStoryData: StoryDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.id;
      if (!authorId) {
        throw new UnauthorizedException('You are not authenticated yet!');
      }
      const story = await this.storyService.createStory(createStoryData, authorId);
      return response.status(201).json(story);
  }

  @Get('')
  @ApiOperation({ summary: 'Get all stories' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest', 'title-asc', 'title-desc'] })
  @ApiQuery({ name: 'tagIds', required: false, type: [String], description: 'Filter by tag IDs (comma-separated)' })
  @ApiResponse({ status: 200, description: 'The stories have been successfully retrieved.', type: PaginatedStoryResponseDto })
  async getAllStories(
    @Query('page') page: number, 
    @Query('perPage') perPage: number,
    @Query('search') search: string, 
    @Query('sort') sort: string,
    @Query('tagIds') tagIds: string,
    @Res() response) {
      const currPage = page > 0 ? page : 1;
      const currPerPage = perPage > 0 ? perPage : 10;
      const tagIdsArray = tagIds ? tagIds.split(',').map(id => id.trim()) : undefined;
      const stories = await this.storyService.getAllStories(
        currPage, 
        currPerPage,
        search,
        sort as 'newest' | 'oldest' | 'title-asc' | 'title-desc',
        tagIdsArray);
      return response.status(200).json(stories);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/:id/details')
  @ApiOperation({ summary: 'Get complete story details with ratings, user rating, history, bookmark status, and tags' })
  @ApiParam({ name: 'id', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'The complete story details have been successfully retrieved.' })
  async getStoryDetails(@Param('id') id: string, @Req() request, @Res() response) {
      const userId = request.user.id;
      const details = await this.storyService.getStoryDetails(id, userId);
      return response.status(200).json(details);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/:id')
  @ApiOperation({ summary: 'Get a specific story' })
  @ApiParam({ name: 'id', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'The story has been successfully retrieved.', type: Story })
  async getStory(@Param() param, @Req() request, @Res() response) {
      const readUserId = request.user.id
      const story = await this.storyService.getSpecificStory(param.id, readUserId);
      return response.status(200).json(story);
  }

  @Get('/user/:userId')
  @ApiOperation({ summary: 'Get stories for a specific user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest', 'title-asc', 'title-desc'] })
  @ApiQuery({ name: 'tagIds', required: false, type: [String], description: 'Filter by tag IDs (comma-separated)' })
  @ApiResponse({ status: 200, description: 'The stories have been successfully retrieved.', type: PaginatedStoryResponseDto })
  async getUserSpecificStory(
    @Query('page') page: number, 
    @Query('perPage') perPage: number, 
    @Query('search') search: string, 
    @Query('sort') sort: string,
    @Query('tagIds') tagIds: string,
    @Res() response, 
    @Param() param
  ) {
      const currPage = page > 0 ? page : 1;
      const currPerPage = perPage > 0 ? perPage : 10;
      const tagIdsArray = tagIds ? tagIds.split(',').map(id => id.trim()) : undefined;
      const story = await this.storyService.getSpecificUserStories(
        param.userId,
        currPage,
        currPerPage,
        search,
        sort as 'newest' | 'oldest' | 'title-asc' | 'title-desc',
        tagIdsArray
      );
      return response.status(200).json(story);
  }

  @Get('/username/:username/public')
  @ApiOperation({ summary: 'Get public stories for a specific username' })
  @ApiParam({ name: 'username', description: 'The username of the user', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest', 'title-asc', 'title-desc'] })
  @ApiQuery({ name: 'tagIds', required: false, type: [String], description: 'Filter by tag IDs (comma-separated)' })
  @ApiResponse({ status: 200, description: 'The public stories have been successfully retrieved.', type: PaginatedStoryResponseDto })
  async getPublicStoriesByUsername(
    @Query('page') page: number, 
    @Query('perPage') perPage: number, 
    @Query('search') search: string, 
    @Query('sort') sort: string,
    @Query('tagIds') tagIds: string,
    @Res() response, 
    @Param('username') username: string
  ) {
      const currPage = page > 0 ? page : 1;
      const currPerPage = perPage > 0 ? perPage : 10;
      const tagIdsArray = tagIds ? tagIds.split(',').map(id => id.trim()) : undefined;
      const stories = await this.storyService.getPublicStoriesByUsername(
        username,
        currPage,
        currPerPage,
        search,
        sort as 'newest' | 'oldest' | 'title-asc' | 'title-desc',
        tagIdsArray
      );
      return response.status(200).json(stories);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Put('/:id')
  @ApiOperation({ summary: 'Update a story' })
  @ApiParam({ name: 'id', description: 'The ID of the story to update', type: String })
  @ApiBody({ type: StoryDto })
  @ApiResponse({ status: 200, description: 'The story has been successfully updated.', type: Story })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateStory(
    @Param() param,
    @Body() data: Partial<StoryDto>,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.id;
      const updateStory = await this.storyService.updateStory(
        param.id,
        authorId,
        data,
      );
      return response.status(200).json(updateStory);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a story' })
  @ApiParam({ name: 'id', description: 'The ID of the story to delete', type: String })
  @ApiResponse({ status: 200, description: 'The story has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteStory(@Param() param, @Req() request, @Res() response) {
      const authorId = request.user.id;
      await this.storyService.deleteStory(param.id, authorId);
      return response.status(200).json({ message: 'Deleted successfully!' });
  
  }
}
