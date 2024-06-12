import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
    UseGuards, 
    Req,
    Res
  } from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '@prisma/client';
import { UserCreationData } from './user.dto';
import { JwtGuard } from './jwt.guard';
import { Response } from 'express';
  
  @Controller('user')
  export class UserController {
    constructor(
      private readonly userService: UserService,
    ) {}
  
    @Post('register')
    async signupUser(
        @Body() userData: UserCreationData,
        @Res() res: Response
    ) {
        const responseData = await this.userService.createUser(userData)
        res.status(201).json(responseData);
    }

    @UseGuards(JwtGuard)
    @Get('')
    async seeUserDetail(@Req() request, @Res() response){
      try{
        const userId = request.user
        return response.status(200).json({"id": userId})
      } catch (error){
        return response.status(400).json({"message":"Error!"})
      }
    }
}