import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StoryDto } from "./story.dto";
import { Prisma, Story } from "@prisma/client";
@Injectable()
export class StoryService{
    constructor(private prisma: PrismaService) {}

    async createStory(data: StoryDto){
        
        const newStory = await this.prisma.story.create({
            data, 
        })

        return newStory
    }

    async getAllStories(){
        const stories = await this.prisma.story.findMany({})
        return stories
    }

    async getSpecificStory(id: string){
        const story = await this.prisma.story.findFirst({
            where: {id: id},
            include:{
                chapters:{
                    orderBy:{
                        order: 'asc'
                    }
                }
            }
        })
        return story
    }

    async getSpecificUserStories(userId:string){
        const stories = await this.prisma.story.findMany({
            where: {authorId: userId}
        })
        return stories
    }

    async updateStory(storyId: string, userId: string, data: StoryDto){

        const story = await this.prisma.story.findFirst({
            where: {id: storyId, authorId: userId}
        })

        if (!story){
            throw new Error("Unauthorized!")
        }

        const updatedStory = await this.prisma.story.update({
            data, 
            where: {id: storyId}
        })

        return updatedStory
    }

    async deleteStory(storyId: string, userId: string){

        const story = await this.prisma.story.findFirst({
            where: {id: storyId, authorId: userId}
        })

        if (!story){
            throw new Error("Unauthorized!")
        }

        const deletedStory = await this.prisma.story.delete({ 
            where: {id: storyId}
        })

        return deletedStory
    }

}