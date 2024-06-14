import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards, 
    Req,
    Res,
    Put, Delete,
    Param,
    Query
} from '@nestjs/common';
import { StoryService } from './story.service';
import { Response } from 'express';
import { StoryDto } from './story.dto';
import { JwtGuard } from 'src/user/jwt.guard';
import { request } from 'http';
  
@Controller('story')
export class StoryController {
    constructor(
        private readonly storyService: StoryService,
    ) {}

    @UseGuards(JwtGuard)
    @Post('')
    async createStory(@Body() createStoryData: StoryDto, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            if (!authorId) {
                throw new Error("Unauthorized!")
            }
            createStoryData.authorId = authorId
            const story = await this.storyService.createStory(createStoryData)
            return response.status(201).json(story)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('')
    async getAllStories(@Res() response){
        try{
            const stories = await this.storyService.getAllStories()
            return response.status(200).json(stories)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('/:id')
    async getStory(@Param() param, @Res() response){
        try{
            const story = await this.storyService.getSpecificStory(param.id)
            return response.status(200).json(story)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('')
    async getUserSpecificStory(@Res() response, @Query('userId') userId: string){
        try{
            const story = await this.storyService.getSpecificUserStories(userId)
            return response.status(200).json(story)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @UseGuards(JwtGuard)
    @Put('/:id')
    async updateStory(@Param() param, @Body() data: StoryDto, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            const updateStory = await this.storyService.updateStory(param.id, authorId, data)
            return response.status(200).json(updateStory)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @UseGuards(JwtGuard)
    @Delete('/:id')
    async deleteStory(@Param() param, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            await this.storyService.deleteStory(param.id, authorId)
            return response.status(200).json({"message": "Deleted successfully!"})
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }
}