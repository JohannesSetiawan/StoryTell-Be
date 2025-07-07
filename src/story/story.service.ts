import { Injectable, Inject, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoryDto, Story } from './story.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getDateInWIB } from '../utils/date';
import { Prisma } from '@prisma/client';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}

export type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

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

  async getAllStories(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    sort?: SortOption,
  ): Promise<PaginatedResult<any>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    const where: Prisma.StoryWhereInput = {
      isprivate: false,
    };
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    let orderBy: Prisma.StoryOrderByWithRelationInput = {};
    switch (sort) {
      case 'oldest':
        orderBy = { dateCreated: 'asc' };
        break;
      case 'title-asc':
        orderBy = { title: 'asc' };
        break;
      case 'title-desc':
        orderBy = { title: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { dateCreated: 'desc' };
        break;
    }

    const [stories, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({
        where,
        include: {
          author: {
            select: {
              username: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.story.count({ where }),
    ]);

    const lastPage = Math.ceil(total / take);

    return {
      data: stories,
      meta: {
        total,
        lastPage,
        currentPage: pageNumber,
        perPage: take,
        prev: pageNumber > 1 ? pageNumber - 1 : null,
        next: pageNumber < lastPage ? pageNumber + 1 : null,
      },
    };
  }

  async getSpecificStory(id: string, readUserId: string) {
    const cachedStoryData = await this.cacheService.get<Story>(
      'story-' + id.toString(),
    );

    if (cachedStoryData) {
      this.checkIsPrivateStory(cachedStoryData, readUserId);
      await this.createReadHistory(readUserId, id);
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
        author: {
          select: {
            username: true,
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

    this.checkIsPrivateStory(story, readUserId);

    await this.createReadHistory(readUserId, id);

    await this.cacheService.set('story-' + id.toString(), story);
    return story;
  }

  async getSpecificUserStories(
    userId: string,
    page: number = 1,
    perPage: number = 10,
    search?: string,
    sort?: SortOption,
  ): Promise<PaginatedResult<any>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    const where: Prisma.StoryWhereInput = {
      authorId: userId,
    };
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    let orderBy: Prisma.StoryOrderByWithRelationInput = {};
    switch (sort) {
      case 'oldest':
        orderBy = { dateCreated: 'asc' };
        break;
      case 'title-asc':
        orderBy = { title: 'asc' };
        break;
      case 'title-desc':
        orderBy = { title: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { dateCreated: 'desc' };
        break;
    }

    const [stories, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.story.count({ where }),
    ]);

    const lastPage = Math.ceil(total / take);

    return {
      data: stories,
      meta: {
        total,
        lastPage,
        currentPage: pageNumber,
        perPage: take,
        prev: pageNumber > 1 ? pageNumber - 1 : null,
        next: pageNumber < lastPage ? pageNumber + 1 : null,
      },
    };
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

  private async createReadHistory(readUserId: string, id: string) {
    await this.prisma.readHistory.upsert({
      create: {
        userId: readUserId,
        storyId: id,
        date: getDateInWIB(new Date())
      },
      update: {
        date: getDateInWIB(new Date())
      },
      where: {
        storyId_userId: { userId: readUserId, storyId: id }
      }
    });
  }

  private checkIsPrivateStory(story: Story, readUserId: string) {
    if (story.isprivate) {
      const authorId = readUserId;
      if (authorId !== story.authorId) {
        throw new UnauthorizedException("You can't access this private story!");
      }
    }
  }
}
