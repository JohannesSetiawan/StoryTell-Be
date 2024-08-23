import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChapterDto } from "./chapter.dto";
import { AuthorizationError } from '../Exceptions/AuthorizationError';
import { NotFoundError } from "../Exceptions/NotFoundError";

@Injectable()
export class ChapterService{
    constructor(private prisma: PrismaService) {}

    async createChapter(data: ChapterDto, userId: string){

        const storyId = data.storyId

        const story = await this.prisma.story.findFirst({
            where: {id: storyId}
        })

        if (!story){
            throw new NotFoundError("Story not found!")
        }

        if (story.authorId !== userId){
            throw new AuthorizationError("You don't have permission to update this story!")
        }
        
        const newChapter = await this.prisma.chapter.create({
            data, 
        })

        return newChapter
    }

    async getAllChapterForStory(storyId: string){
        const chapters = await this.prisma.chapter.findMany({
            where: {storyId: storyId},
            orderBy:{order: 'asc'}
        })

        return chapters
    }

    async getSpecificChapter(id: string){
        const chapter = await this.prisma.chapter.findUnique({
            where: {id: id}
        })

        if (!chapter){
            throw new NotFoundError("Chapter not found!")
        }

        return chapter
    }

    async updateChapter(chapterId: string, userId: string, data: ChapterDto){

        const storyId = data.storyId

        const story = await this.prisma.story.findFirst({
            where: {id: storyId}
        })

        if (!story){
            throw new NotFoundError("Story not found!")
        }

        if (story.authorId !== userId){
            throw new AuthorizationError("You don't have permission to update this chapter!")
        }

        const chapter = await this.prisma.chapter.findUnique({
            where: {id: chapterId}
        })

        if (!chapter){
            throw new NotFoundError("Chapter not found!")
        }

        const updatedChapter = await this.prisma.chapter.update({
            data, 
            where: {id: chapterId, storyId: storyId}
        })

        return updatedChapter
    }

    async deleteChapter(chapterId: string, userId: string){

        const chapter = await this.prisma.chapter.findFirst({
            where: {id: chapterId}
        })

        if (!chapter){
            throw new NotFoundError("Chapter not found!")
        }
        
        const story = await this.prisma.story.findFirst({
            where: {id: chapter.storyId}
        })

        if (!story){
            throw new NotFoundError("Story not found!")
        }

        if (story.authorId !== userId){
            throw new AuthorizationError("You don't have permission to update this story!")
        }

        if (!story){
            throw new AuthorizationError("You don't have permission to delete this chapter!")
        }

        const deletedChapter = await this.prisma.chapter.delete({ 
            where: {id: chapterId}
        })

        return deletedChapter
    }

}