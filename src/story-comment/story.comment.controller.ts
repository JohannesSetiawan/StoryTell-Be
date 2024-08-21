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
import { JwtGuard } from 'src/user/jwt.guard';
import { StoryCommentService } from './story.comment.service';
import { StoryCommentDto } from './story.comment.dto';
import { AuthenticationError } from '../Exceptions/AuthenticationError';
  
@Controller('storyComment')
export class StoryCommentController {
    constructor(
        private readonly storyCommentService: StoryCommentService,
    ) {}

    @UseGuards(JwtGuard)
    @Post('/:storyId')
    async createStoryComment(@Param() param, @Body() createCommentData: StoryCommentDto, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            const storyId = param.storyId

            if (!authorId) {
                throw new AuthenticationError("You are not authenticated yet!")
            }

            const comment = await this.storyCommentService.createStoryComment(createCommentData, authorId, storyId)
            return response.status(201).json(comment)
        } catch(error){
            if (typeof error.status !== 'undefined'){
                return response.status(error.status).json({"message": error.message})
            }
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('/:storyId')
    async getAllCommentForStory(@Res() response, @Param() param){
        try{
            const storyId = param.storyId
            const comments = await this.storyCommentService.getAllStoryCommentForStory(storyId)
            return response.status(200).json(comments)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('/:storyId/:id')
    async getSpecificComment(@Param() param, @Res() response){
        try{
            const chapter = await this.storyCommentService.getSpecificCommentForStory(param.id)
            return response.status(200).json(chapter)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @UseGuards(JwtGuard)
    @Put('/:storyId/:id')
    async updateComment(@Param() param, @Body() data: StoryCommentDto, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            const storyId = param.storyId
            const updatedComment = await this.storyCommentService.updateComment(param.id, authorId, storyId, data)
            return response.status(200).json(updatedComment)
        } catch(error){
            if (typeof error.status !== 'undefined'){
                return response.status(error.status).json({"message": error.message})
            }
            return response.status(400).json({"message": error.message})
        }
    }

    @UseGuards(JwtGuard)
    @Delete('/:storyId/:id')
    async deleteChapter(@Param() param, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            await this.storyCommentService.deleteComment(param.id, authorId, param.storyId)
            return response.status(200).json({"message": "Deleted successfully!"})
        } catch(error){
            if (typeof error.status !== 'undefined'){
                return response.status(error.status).json({"message": error.message})
            }
            return response.status(400).json({"message": error.message})
        }
    }
}