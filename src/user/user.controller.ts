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
import { UpdateUserData, UserCreationData, UserLoginData, User, LoginResponseDto, UserResponseDto } from './user.dto';
import { JwtGuard } from './jwt.guard';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: UserCreationData })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async signupUser(@Body() userData: UserCreationData, @Res() res: Response) {
    try {
      const responseData = await this.userService.register(userData);
      return res.status(201).json(responseData);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: UserLoginData })
  @ApiResponse({ status: 201, description: 'The user has been successfully logged in.', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async login(@Body() userData: UserLoginData, @Res() res: Response) {
    try {
      const responseData = await this.userService.login(userData);
      return res.status(201).json(responseData);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('')
  @ApiOperation({ summary: 'Get user detail' })
  @ApiResponse({ status: 200, description: 'The user detail.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async seeUserDetail(@Req() request, @Res() response) {
    try {
      const userId = request.user.id;
      if (!userId) {
        console.log(request)
        throw new Error('User ID not found in request');
      }
      const responseData = await this.userService.user(userId);
      return response.status(200).json(responseData);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Put('')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateUserData })
  @ApiResponse({ status: 200, description: 'The user has been successfully updated.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async changeProfile(@Body() userData: UpdateUserData, @Req() request, @Res() response) {
    try {
      const id = request.user.id;
      const updatingUser = request.user
      console.log('Updated user ID:', id, 'by', updatingUser);
      const responseData = await this.userService.updateUser(id, userData, updatingUser);
      return response.status(200).json(responseData);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }
}
