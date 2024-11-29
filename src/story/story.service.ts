import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoryDto, Story } from './story.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class StoryService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createStory(data: StoryDto) {
    const newStory = await this.prisma.story.create({
      data,
    });

    return newStory;
  }

  async getAllStories() {
    const stories = await this.prisma.story.findMany({
      where: { isprivate: false },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });
    return stories;
  }

  async getSpecificStory(id: string) {
    const cachedStoryData = await this.cacheService.get<Story>(
      'story-' + id.toString(),
    );

    if (cachedStoryData) {
      return cachedStoryData;
    }

    const story = await this.prisma.story.findUnique({
      where: { id: id },
      include: {
        chapters: {
          orderBy: {
            order: 'asc',
          },
        },
        storyComments: {
          where: {chapter: null},
          include: { author: { select: { username: true } } },
          orderBy: { dateCreated: 'desc' },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found!');
    }
    await this.cacheService.set('story-' + id.toString(), story);
    return story;
  }

  async getSpecificUserStories(userId: string) {
    const stories = await this.prisma.story.findMany({
      where: { authorId: userId },
    });
    return stories;
  }

  async updateStory(storyId: string, userId: string, data: StoryDto) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to update this story!",
      );
    }

    const updatedStory = await this.prisma.story.update({
      data,
      where: { id: storyId },
    });

    await this.cacheService.del('story-' + storyId.toString());

    return updatedStory;
  }

  async deleteStory(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to delete this story!",
      );
    }

    const deletedStory = await this.prisma.story.delete({
      where: { id: storyId },
    });

    await this.cacheService.del('story-' + storyId.toString());

    return deletedStory;
  }
}
