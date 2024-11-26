import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Param,
  Put
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserData, UserCreationData, UserLoginData } from './user.dto';
import { JwtGuard } from './jwt.guard';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async signupUser(@Body() userData: UserCreationData, @Res() res: Response) {
    try {
      const responseData = await this.userService.register(userData);
      return res.status(201).json(responseData);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @Post('login')
  async login(@Body() userData: UserLoginData, @Res() res: Response) {
    try {
      const responseData = await this.userService.login(userData);
      return res.status(201).json(responseData);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @Get('')
  async seeUserDetail(@Req() request, @Res() response) {
    try {
      const userId = request.user.userId;
      const responseData = await this.userService.user(userId);
      return response.status(200).json(responseData);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @Put('/:userId')
  async changeProfile(@Body() userData: Prisma.UserUpdateInput, @Req() request, @Res() response, @Param() param) {
    try {
      const id = param.userId;
      const updatingUser = request.user
      const responseData = await this.userService.updateUser({where: {id}, data: userData}, updatingUser);
      return response.status(200).json(responseData);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }
}
