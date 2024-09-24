import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChapterDto } from './chapter.dto';
import { Chapter } from 'src/story/story.dto';
import { AuthorizationError } from '../Exceptions/AuthorizationError';
import { NotFoundError } from '../Exceptions/NotFoundError';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ChapterService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createChapter(data: ChapterDto, userId: string) {
    const storyId = data.storyId;

    const story = await this.prisma.story.findFirst({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundError('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new AuthorizationError(
        "You don't have permission to update this story!",
      );
    }

    const newChapter = await this.prisma.chapter.create({
      data,
    });

    await this.cacheService.del('story-' + storyId.toString());

    return newChapter;
  }

  async getAllChapterForStory(storyId: string) {
    const chapters = await this.prisma.chapter.findMany({
      where: { storyId: storyId },
      orderBy: { order: 'asc' },
    });

    return chapters;
  }

  async getSpecificChapter(id: string) {
    const cachedChapterData = await this.cacheService.get<Chapter>(
      'chapter-' + id.toString(),
    );

    if (cachedChapterData) {
      return cachedChapterData;
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: id },
    });

    if (!chapter) {
      throw new NotFoundError('Chapter not found!');
    }

    await this.cacheService.set('chapter-' + id.toString(), chapter);

    return chapter;
  }

  async updateChapter(chapterId: string, userId: string, data: ChapterDto) {
    const storyId = data.storyId;

    const story = await this.prisma.story.findFirst({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundError('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new AuthorizationError(
        "You don't have permission to update this chapter!",
      );
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundError('Chapter not found!');
    }

    const updatedChapter = await this.prisma.chapter.update({
      data,
      where: { id: chapterId, storyId: storyId },
    });

    await this.cacheService.del('chapter-' + chapterId.toString());

    return updatedChapter;
  }

  async deleteChapter(chapterId: string, userId: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundError('Chapter not found!');
    }

    const story = await this.prisma.story.findFirst({
      where: { id: chapter.storyId },
    });

    if (!story) {
      throw new NotFoundError('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new AuthorizationError(
        "You don't have permission to update this story!",
      );
    }

    if (!story) {
      throw new AuthorizationError(
        "You don't have permission to delete this chapter!",
      );
    }

    const deletedChapter = await this.prisma.chapter.delete({
      where: { id: chapterId },
    });

    await this.cacheService.del('chapter-' + chapterId.toString());

    return deletedChapter;
  }
}
