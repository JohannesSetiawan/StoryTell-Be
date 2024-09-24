import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { StoryCommentDto } from './story.comment.dto';
import { AuthorizationError } from '../Exceptions/AuthorizationError';
import { NotFoundError } from '../Exceptions/NotFoundError';

@Injectable()
export class StoryCommentService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createStoryComment(
    data: StoryCommentDto,
    userId: string,
    storyId: string,
  ) {
    const { content, parentId } = data;

    const newStoryComment = await this.prisma.storyComment.create({
      data: { storyId, content, parentId, authorId: userId },
    });

    await this.cacheService.del('story-' + storyId.toString());

    return newStoryComment;
  }

  async getAllStoryCommentForStory(storyId: string) {
    const comments = await this.prisma.storyComment.findMany({
      where: { storyId: storyId },
      orderBy: { dateCreated: 'asc' },
      include: { author: { select: { username: true } } },
    });

    return comments;
  }

  async getSpecificCommentForStory(commentId: string) {
    const comment = await this.prisma.storyComment.findUnique({
      where: { id: commentId },
    });

    return comment;
  }

  async updateComment(
    commentId: string,
    userId: string,
    storyId: string,
    data: StoryCommentDto,
  ) {
    const comment = await this.prisma.storyComment.findFirst({
      where: { id: commentId, storyId },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found!');
    }

    if (comment.authorId !== userId) {
      throw new AuthorizationError(
        'You are not allowed to changes this comment!',
      );
    }

    const updatedComment = await this.prisma.storyComment.update({
      data,
      where: { id: commentId, authorId: userId, storyId },
    });

    await this.cacheService.del('story-' + storyId.toString());

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string, storyId: string) {
    const comment = await this.prisma.storyComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found!');
    }

    if (comment.authorId !== userId) {
      throw new AuthorizationError(
        'You are not allowed to changes this comment!',
      );
    }

    const deletedComment = await this.prisma.storyComment.delete({
      where: { id: commentId, authorId: userId },
    });

    await this.cacheService.del('story-' + storyId.toString());

    return deletedComment;
  }
}
