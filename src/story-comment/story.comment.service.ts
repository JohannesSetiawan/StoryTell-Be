import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StoryCommentDto } from "./story.comment.dto";
import { AuthorizationError } from '../Exceptions/AuthorizationError';
import { NotFoundError } from "src/Exceptions/NotFoundError";

@Injectable()
export class StoryCommentService{
    constructor(private prisma: PrismaService) {}

    async createStoryComment(data: StoryCommentDto, userId: string, storyId: string){

        const {content} = data
        
        const newStoryComment = await this.prisma.storyComment.create({
            data: {storyId, content, authorId: userId}, 
        })

        return newStoryComment
    }

    async getAllStoryCommentForStory(storyId: string){
        const comments = await this.prisma.storyComment.findMany({
            where: {storyId: storyId},
            orderBy:{dateCreated: 'asc'},
            include:{author:{select:{username:true}}}
        })

        return comments
    }

    async getSpecificCommentForStory(storyId: string){
        const comment = await this.prisma.storyComment.findUnique({
            where: {id: storyId}
        })

        return comment
    }

    async updateComment(commentId: string, userId: string, storyId: string, data: StoryCommentDto){

        const comment = await this.prisma.storyComment.findFirst({
            where: {id: commentId, authorId: userId, storyId}
        })

        if (!comment){
            throw new NotFoundError("Comment not found!")
        }

        const updatedComment = await this.prisma.storyComment.update({
            data, 
            where: {id: commentId, authorId: userId, storyId}
        })

        return updatedComment
    }

    async deleteComment(commentId: string, userId: string, storyId: string){

        const comment = await this.prisma.storyComment.findFirst({
            where: {id: commentId, authorId: userId, storyId}
        })
        
        if (!comment){
            throw new NotFoundError("Comment not found!")
        }

        const deletedComment = await this.prisma.storyComment.delete({ 
            where: {id: commentId, authorId: userId}
        })

        return deletedComment
    }

}