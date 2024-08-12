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
import { ChapterService } from './chapter.service';
import { ChapterDto } from './chapter.dto';
import { AuthenticationError } from '../Exceptions/AuthenticationError';
  
@Controller('chapter')
export class ChapterController {
    constructor(
        private readonly chapterService: ChapterService,
    ) {}

    @UseGuards(JwtGuard)
    @Post('')
    async createChapter(@Body() createChapterData: ChapterDto, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId

            if (!authorId) {
                throw new AuthenticationError("You are not authenticated yet!")
            }

            const chapter = await this.chapterService.createChapter(createChapterData, authorId)
            return response.status(201).json(chapter)
        } catch(error){
            if (typeof error.status !== 'undefined'){
                return response.status(error.status).json({"message": error.message})
            }
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('')
    async getAllChaptersForStory(@Res() response, @Query("storyId") storyId: string){
        try{
            const chapters = await this.chapterService.getAllChapterForStory(storyId)
            return response.status(200).json(chapters)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @Get('/:id')
    async getChapter(@Param() param, @Res() response){
        try{
            const chapter = await this.chapterService.getSpecificChapter(param.id)
            return response.status(200).json(chapter)
        } catch(error){
            return response.status(400).json({"message": error.message})
        }
    }

    @UseGuards(JwtGuard)
    @Put('/:id')
    async updateChapter(@Param() param, @Body() data: ChapterDto, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            const updatedChapter = await this.chapterService.updateChapter(param.id, authorId, data)
            return response.status(200).json(updatedChapter)
        } catch(error){
            if (typeof error.status !== 'undefined'){
                return response.status(error.status).json({"message": error.message})
            }
            return response.status(400).json({"message": error.message})
        }
    }

    @UseGuards(JwtGuard)
    @Delete('/:id')
    async deleteChapter(@Param() param, @Req() request, @Res() response){
        try{
            const authorId = request.user.userId
            await this.chapterService.deleteChapter(param.id, authorId)
            return response.status(200).json({"message": "Deleted successfully!"})
        } catch(error){
            if (typeof error.status !== 'undefined'){
                return response.status(error.status).json({"message": error.message})
            }
            return response.status(400).json({"message": error.message})
        }
    }
}