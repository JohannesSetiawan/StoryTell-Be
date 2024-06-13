import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChapterDto } from "./chapter.dto";

@Injectable()
export class ChapterService{
    constructor(private prisma: PrismaService) {}

    async createChapter(data: ChapterDto, userId: string){

        const storyId = data.storyId

        const story = await this.prisma.story.findFirst({
            where: {id: storyId, authorId: userId}
        })

        if (!story){
            throw new Error("Unauthorized!")
        }
        
        const newChapter = await this.prisma.chapter.create({
            data, 
        })

        return newChapter
    }

    async getAllChapterForStory(storyId: string){
        const stories = await this.prisma.chapter.findMany({
            where: {storyId: storyId},
            orderBy:{order: 'asc'}
        })

        return stories
    }

    async getSpecificChapter(id: string){
        const story = await this.prisma.chapter.findFirst({
            where: {id: id}
        })
        return story
    }

    async updateChapter(chapterId: string, userId: string, data: ChapterDto){

        const storyId = data.storyId

        const story = await this.prisma.story.findFirst({
            where: {id: storyId, authorId: userId}
        })

        if (!story){
            throw new Error("Unauthorized!")
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
        
        const story = await this.prisma.story.findFirst({
            where:{id: chapter.storyId, authorId: userId}
        })

        if (!story){
            throw new Error("Unauthorized!")
        }

        const deletedStory = await this.prisma.chapter.delete({ 
            where: {id: chapterId}
        })

        return deletedStory
    }

}