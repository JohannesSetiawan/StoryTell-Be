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

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtGuard)
  @Get('/user')
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
