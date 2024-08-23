import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StoryDto } from "./story.dto";
import { Prisma, Story } from "@prisma/client";
import { AuthorizationError } from '../Exceptions/AuthorizationError';
import { NotFoundError } from "../Exceptions/NotFoundError";

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
        const stories = await this.prisma.story.findMany({
            where: {isprivate: false},
            include: {
                author: {
                  select: {
                    username: true,
                  },
                },
              },
        })
        return stories
    }

    async getSpecificStory(id: string){
        const story = await this.prisma.story.findUnique({
            where: {id: id},
            include:{
                chapters:{
                    orderBy:{
                        order: 'asc'
                    }
                }
            }
        })

        if (!story){
            throw new NotFoundError("Story not found!")
        }

        return story
    }

    async getSpecificUserStories(userId:string){
        const stories = await this.prisma.story.findMany({
            where: {authorId: userId}
        })
        return stories
    }

    async updateStory(storyId: string, userId: string, data: StoryDto){

        const story = await this.prisma.story.findUnique({
            where: {id: storyId}
        })

        if (!story){
            throw new NotFoundError("Story not found!")
        }

        if (story.authorId !== userId){
            throw new AuthorizationError("You don't have permission to update this story!")
        }

        const updatedStory = await this.prisma.story.update({
            data, 
            where: {id: storyId}
        })

        return updatedStory
    }

    async deleteStory(storyId: string, userId: string){

        const story = await this.prisma.story.findUnique({
            where: {id: storyId}
        })

        if (!story){
            throw new NotFoundError("Story not found!")
        }

        if (story.authorId !== userId){
            throw new AuthorizationError("You don't have permission to delete this story!")
        }

        const deletedStory = await this.prisma.story.delete({ 
            where: {id: storyId}
        })

        return deletedStory
    }

}