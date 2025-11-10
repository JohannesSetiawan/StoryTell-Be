import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { AdminService } from './admin.service';
import { UserTokenPayload } from 'src/user/user.dto';
import { ApiOperation, ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAllChapterResponseDto, AdminAllCommentResponseDto, AdminAllStoryResponseDto, AdminAllUserResponseDto } from './admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtGuard)
  @Get('/user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'The users have been successfully retrieved.', type: [AdminAllUserResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllUsers(
    @Req() request,
    @Res() response,
  ) {
    const user: UserTokenPayload = request.user
    if(!user.isAdmin){
      throw new ForbiddenException("You don't have access!")
    }
    const users = await this.adminService.getAllUser();
    return response.status(200).json(users);
  }

  @UseGuards(JwtGuard)
  @Get('/story')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stories (Admin only)' })
  @ApiResponse({ status: 200, description: 'The stories have been successfully retrieved.', type: [AdminAllStoryResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllStories(
    @Req() request,
    @Res() response,
  ) {
    const user: UserTokenPayload = request.user
      if(!user.isAdmin){
        throw new ForbiddenException("You don't have access!")
      }
      const users = await this.adminService.getAllStories();
      return response.status(200).json(users);
  }

  @UseGuards(JwtGuard)
  @Get('/chapter')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all chapters (Admin only)' })
  @ApiResponse({ status: 200, description: 'The chapters have been successfully retrieved.', type: [AdminAllChapterResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllChapters(
    @Req() request,
    @Res() response,
  ) {
    const user: UserTokenPayload = request.user
    if(!user.isAdmin){
      throw new ForbiddenException("You don't have access!")
    }
    const users = await this.adminService.getAllChapters();
    return response.status(200).json(users);
  }

  @UseGuards(JwtGuard)
  @Get('/comment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments (Admin only)' })
  @ApiResponse({ status: 200, description: 'The comments have been successfully retrieved.', type: [AdminAllCommentResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllComments(
    @Req() request,
    @Res() response,
  ) {
    const user: UserTokenPayload = request.user
    if(!user.isAdmin){
      throw new ForbiddenException("You don't have access!")
    }
    const users = await this.adminService.getAllComments();
    return response.status(200).json(users);
  }
}
