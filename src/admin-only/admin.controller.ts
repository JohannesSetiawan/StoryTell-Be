import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { AdminService } from './admin.service';
import { UserTokenPayload } from 'src/user/user.dto';
import { ApiOperation, ApiBearerAuth, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AdminAllChapterResponseDto, AdminAllCommentResponseDto, AdminAllStoryResponseDto, AdminAllUserResponseDto, PaginatedResponseDto } from './admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtGuard)
  @Get('/user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'username', required: false, type: String, description: 'Filter by username (partial match)' })
  @ApiQuery({ name: 'isAdmin', required: false, type: Boolean, description: 'Filter by admin role' })
  @ApiResponse({ status: 200, description: 'The users have been successfully retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllUsers(
    @Req() request,
    @Res() response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('username') username?: string,
    @Query('isAdmin') isAdmin?: string,
  ) {
    const user: UserTokenPayload = request.user
    if(!user.isAdmin){
      throw new ForbiddenException("You don't have access!")
    }
    const pageNum = page ? Math.max(1, parseInt(page)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 10;
    const isAdminBool = isAdmin === 'true' ? true : isAdmin === 'false' ? false : undefined;
    
    const users = await this.adminService.getAllUser({ 
      page: pageNum, 
      limit: limitNum,
      username,
      isAdmin: isAdminBool
    });
    return response.status(200).json(users);
  }

  @UseGuards(JwtGuard)
  @Get('/story')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stories (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Filter by story title (partial match)' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Filter by author username (partial match)' })
  @ApiQuery({ name: 'isPrivate', required: false, type: Boolean, description: 'Filter by privacy status' })
  @ApiResponse({ status: 200, description: 'The stories have been successfully retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllStories(
    @Req() request,
    @Res() response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('title') title?: string,
    @Query('author') author?: string,
    @Query('isPrivate') isPrivate?: string,
  ) {
    const user: UserTokenPayload = request.user
      if(!user.isAdmin){
        throw new ForbiddenException("You don't have access!")
      }
      const pageNum = page ? Math.max(1, parseInt(page)) : 1;
      const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 10;
      const isPrivateBool = isPrivate === 'true' ? true : isPrivate === 'false' ? false : undefined;
      
      const stories = await this.adminService.getAllStories({ 
        page: pageNum, 
        limit: limitNum,
        title,
        author,
        isPrivate: isPrivateBool
      });
      return response.status(200).json(stories);
  }

  @UseGuards(JwtGuard)
  @Get('/chapter')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all chapters (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'story', required: false, type: String, description: 'Filter by story title (partial match)' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Filter by author username (partial match)' })
  @ApiQuery({ name: 'content', required: false, type: String, description: 'Filter by content (partial match)' })
  @ApiResponse({ status: 200, description: 'The chapters have been successfully retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllChapters(
    @Req() request,
    @Res() response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('story') story?: string,
    @Query('author') author?: string,
    @Query('content') content?: string,
  ) {
    const user: UserTokenPayload = request.user
    if(!user.isAdmin){
      throw new ForbiddenException("You don't have access!")
    }
    const pageNum = page ? Math.max(1, parseInt(page)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 10;
    
    const chapters = await this.adminService.getAllChapters({ 
      page: pageNum, 
      limit: limitNum,
      story,
      author,
      content
    });
    return response.status(200).json(chapters);
  }

  @UseGuards(JwtGuard)
  @Get('/comment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'content', required: false, type: String, description: 'Filter by comment content (partial match)' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Filter by author username (partial match)' })
  @ApiQuery({ name: 'story', required: false, type: String, description: 'Filter by story title (partial match)' })
  @ApiQuery({ name: 'chapter', required: false, type: String, description: 'Filter by chapter title (partial match)' })
  @ApiResponse({ status: 200, description: 'The comments have been successfully retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllComments(
    @Req() request,
    @Res() response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('content') content?: string,
    @Query('author') author?: string,
    @Query('story') story?: string,
    @Query('chapter') chapter?: string,
  ) {
    const user: UserTokenPayload = request.user
    if(!user.isAdmin){
      throw new ForbiddenException("You don't have access!")
    }
    const pageNum = page ? Math.max(1, parseInt(page)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 10;
    
    const comments = await this.adminService.getAllComments({ 
      page: pageNum, 
      limit: limitNum,
      content,
      author,
      story,
      chapter
    });
    return response.status(200).json(comments);
  }
}
