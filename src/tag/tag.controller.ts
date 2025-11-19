import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto, UpdateTagDto, AssignTagsDto, TagFilterDto } from './tag.dto';
import { JwtGuard } from '../user/jwt.guard';
import { UserTokenPayload } from '../user/user.dto';
import { ApiOperation, ApiBearerAuth, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';

@ApiTags('tags')
@Controller('tag')
export class TagController {
  constructor(
    private readonly tagService: TagService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ========== ADMIN ENDPOINTS ==========

  @UseGuards(JwtGuard)
  @Post('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Tag already exists' })
  async createTag(@Req() request, @Res() response, @Body() data: CreateTagDto) {
    const user: UserTokenPayload = request.user;
    if (!user.isAdmin) {
      throw new ForbiddenException("You don't have access!");
    }

    const tag = await this.tagService.createTag(data);
    return response.status(201).json(tag);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all tags with optional filtering (Public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by tag name (partial match)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category (partial match)' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getAllTags(
    @Res() response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('name') name?: string,
    @Query('category') category?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 50;

    const tags = await this.tagService.getAllTags({
      page: pageNum,
      limit: limitNum,
      name,
      category,
    });
    return response.status(200).json(tags);
  }

  @Get('admin/categories')
  @ApiOperation({ summary: 'Get all tag categories (Public)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getTagCategories(@Res() response) {
    const categories = await this.tagService.getTagCategories();
    return response.status(200).json({ categories });
  }

  @Get('admin/:id')
  @ApiOperation({ summary: 'Get a specific tag by ID (Public)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getTagById(@Res() response, @Param('id') id: string) {
    const tag = await this.tagService.getTagById(id);
    return response.status(200).json(tag);
  }

  @UseGuards(JwtGuard)
  @Put('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tag (Admin only)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async updateTag(
    @Req() request,
    @Res() response,
    @Param('id') id: string,
    @Body() data: UpdateTagDto,
  ) {
    const user: UserTokenPayload = request.user;
    if (!user.isAdmin) {
      throw new ForbiddenException("You don't have access!");
    }

    const tag = await this.tagService.updateTag(id, data);
    return response.status(200).json(tag);
  }

  @UseGuards(JwtGuard)
  @Delete('admin/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tag (Admin only)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async deleteTag(@Req() request, @Res() response, @Param('id') id: string) {
    const user: UserTokenPayload = request.user;
    if (!user.isAdmin) {
      throw new ForbiddenException("You don't have access!");
    }

    const tag = await this.tagService.deleteTag(id);
    return response.status(200).json(tag);
  }

  // ========== USER ENDPOINTS ==========

  @Get('story/:storyId')
  @ApiOperation({ summary: 'Get all tags for a specific story (Public)' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getStoryTags(@Res() response, @Param('storyId') storyId: string) {
    const tags = await this.tagService.getStoryTags(storyId);
    return response.status(200).json(tags);
  }

  @UseGuards(JwtGuard)
  @Post('story/:storyId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign tags to your story (User must own the story)' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'Tags assigned successfully' })
  @ApiResponse({ status: 403, description: 'You do not own this story' })
  @ApiResponse({ status: 404, description: 'Story or tags not found' })
  async assignTagsToStory(
    @Req() request,
    @Res() response,
    @Param('storyId') storyId: string,
    @Body() data: AssignTagsDto,
  ) {
    const user: UserTokenPayload = request.user;

    // Check if user owns the story
    const storyResult = await this.dataSource.query(
      'SELECT * FROM "Story" WHERE id = $1',
      [storyId],
    );

    if (storyResult.length === 0) {
      return response.status(404).json({ message: 'Story not found' });
    }

    if (storyResult[0].authorId !== user.id) {
      throw new ForbiddenException('You can only assign tags to your own stories');
    }

    await this.tagService.assignTagsToStory(storyId, data.tagIds);
    return response.status(200).json({ message: 'Tags assigned successfully' });
  }

  @UseGuards(JwtGuard)
  @Delete('story/:storyId/tag/:tagId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific tag from your story (User must own the story)' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiParam({ name: 'tagId', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  @ApiResponse({ status: 403, description: 'You do not own this story' })
  @ApiResponse({ status: 404, description: 'Story or tag assignment not found' })
  async removeTagFromStory(
    @Req() request,
    @Res() response,
    @Param('storyId') storyId: string,
    @Param('tagId') tagId: string,
  ) {
    const user: UserTokenPayload = request.user;

    // Check if user owns the story
    const storyResult = await this.dataSource.query(
      'SELECT * FROM "Story" WHERE id = $1',
      [storyId],
    );

    if (storyResult.length === 0) {
      return response.status(404).json({ message: 'Story not found' });
    }

    if (storyResult[0].authorId !== user.id) {
      throw new ForbiddenException('You can only remove tags from your own stories');
    }

    await this.tagService.removeTagFromStory(storyId, tagId);
    return response.status(200).json({ message: 'Tag removed successfully' });
  }

  @UseGuards(JwtGuard)
  @Delete('story/:storyId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove all tags from your story (User must own the story)' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'All tags removed successfully' })
  @ApiResponse({ status: 403, description: 'You do not own this story' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async removeAllTagsFromStory(
    @Req() request,
    @Res() response,
    @Param('storyId') storyId: string,
  ) {
    const user: UserTokenPayload = request.user;

    // Check if user owns the story
    const storyResult = await this.dataSource.query(
      'SELECT * FROM "Story" WHERE id = $1',
      [storyId],
    );

    if (storyResult.length === 0) {
      return response.status(404).json({ message: 'Story not found' });
    }

    if (storyResult[0].authorId !== user.id) {
      throw new ForbiddenException('You can only remove tags from your own stories');
    }

    await this.tagService.removeAllTagsFromStory(storyId);
    return response.status(200).json({ message: 'All tags removed successfully' });
  }
}
