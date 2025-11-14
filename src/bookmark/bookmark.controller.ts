import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  Param,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto, DeleteBookmarkDto } from './bookmark.dto';
import { JwtGuard } from 'src/user/jwt.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('bookmark')
@Controller('bookmark')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a new bookmark' })
  @ApiBody({ type: CreateBookmarkDto })
  @ApiResponse({ status: 201, description: 'Bookmark created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Story already bookmarked.' })
  async createBookmark(
    @Body() createBookmarkData: CreateBookmarkDto,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    await this.bookmarkService.createBookmark(userId, createBookmarkData.storyId);
    return response.status(201).json({ message: 'success' });
  }

  @Get('')
  @ApiOperation({ summary: 'Get all bookmarks for the logged-in user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Bookmarks retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getAllBookmarks(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    const currPage = page > 0 ? page : 1;
    const currPerPage = perPage > 0 ? perPage : 10;
    const bookmarks = await this.bookmarkService.getAllBookmarks(userId, currPage, currPerPage);
    return response.status(200).json(bookmarks);
  }

  @Delete('')
  @ApiOperation({ summary: 'Delete a bookmark' })
  @ApiBody({ type: DeleteBookmarkDto })
  @ApiResponse({ status: 200, description: 'Bookmark deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Bookmark not found.' })
  async deleteBookmark(
    @Body() deleteBookmarkData: DeleteBookmarkDto,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    await this.bookmarkService.deleteBookmark(userId, deleteBookmarkData.storyId);
    return response.status(200).json({ message: 'success' });
  }

  @Get('/check/:storyId')
  @ApiOperation({ summary: 'Check if a story is bookmarked' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'Bookmark status retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async checkBookmarkStatus(
    @Param('storyId') storyId: string,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    const isBookmarked = await this.bookmarkService.checkBookmarkStatus(userId, storyId);
    return response.status(200).json({ isBookmarked });
  }
}
