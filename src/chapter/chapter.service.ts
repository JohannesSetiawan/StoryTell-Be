import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChapterDto, Chapter } from './chapter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getDateInWIB } from '../utils/date';
import { FollowService } from '../follow/follow.service';
import { ActivityType } from '../follow/follow.dto';

@Injectable()
export class ChapterService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
    private followService: FollowService,
  ) {}

  async createChapter(data: ChapterDto, userId: string): Promise<Chapter> {
    const { storyId, title, content, order } = data;

    const storyResult = await this.dataSource.query('SELECT "authorId", isprivate FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException("You don't have permission to update this story!");
    }

    const query = `
      INSERT INTO "Chapter" ("storyId", title, content, "order")
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [storyId, title, content, order];
    const newChapterResult = await this.dataSource.query(query, values);
    const newChapter = newChapterResult[0];

    // Create activity feed entry for new chapter (only if story is not private)
    if (!story.isprivate) {
      try {
        await this.followService.createActivity(
          userId,
          ActivityType.NEW_CHAPTER,
          storyId,
          newChapter.id,
          { chapterTitle: newChapter.title, chapterOrder: newChapter.order }
        );
      } catch (error) {
        console.error('Failed to create activity feed entry:', error);
      }
    }

    // Invalidate cache and proactively refresh with updated data
    await this.cacheService.del('story-' + storyId.toString());
    this.refreshStoryCache(storyId).catch(() => {});

    return newChapter;
  }

  async getAllChapterForStory(storyId: string): Promise<Chapter[]> {
    const query = 'SELECT id, title, content, "order", "storyId", "dateCreated" FROM "Chapter" WHERE "storyId" = $1 ORDER BY "order" ASC';
    const chaptersResult = await this.dataSource.query(query, [storyId]);
    return chaptersResult;
  }

  async getSpecificChapter(id: string, readUserId: string): Promise<Chapter> {
    const cachedChapterData = await this.cacheService.get<Chapter>(
      'chapter-' + id.toString(),
    );

    if (cachedChapterData) {
      if(readUserId) await this.createReadHistory(readUserId, cachedChapterData.storyId, cachedChapterData.id);
      return cachedChapterData;
    }

    const chapterQuery = `
      SELECT c.*, s."authorId" as "storyAuthorId", s.isprivate as "storyIsPrivate"
      FROM "Chapter" c 
      JOIN "Story" s ON c."storyId" = s.id
      WHERE c.id = $1
    `;
    const chapterResult = await this.dataSource.query(chapterQuery, [id]);
    const chapter = chapterResult[0];

    if (!chapter) {
      throw new NotFoundException('Chapter not found!');
    }

    const commentsQuery = `
      SELECT cc.*, u.username as "authorUsername"
      FROM "StoryComment" cc
      LEFT JOIN "User" u ON cc."authorId" = u.id
      WHERE cc."chapterId" = $1
      ORDER BY cc."dateCreated" DESC
    `;
    const commentsResult = await this.dataSource.query(commentsQuery, [id]);
    chapter.chapterComments = commentsResult.map(comment => ({
      ...comment,
      author: { username: comment.authorUsername }
    }));

    if(readUserId) await this.createReadHistory(readUserId, chapter.storyId, chapter.id);
    
    if (chapter.storyIsPrivate && chapter.storyAuthorId != readUserId) {
      throw new ForbiddenException("You don't have permission to read this chapter!");
    }

    await this.cacheService.set('chapter-' + id.toString(), chapter);

    return chapter;
  }

  async updateChapter(chapterId: string, userId: string, data: Partial<ChapterDto>): Promise<Chapter> {
    const { storyId, title, content, order } = data;

    const storyResult = await this.dataSource.query('SELECT "authorId" FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException("You don't have permission to update this chapter!");
    }

    const chapterResult = await this.dataSource.query('SELECT id FROM "Chapter" WHERE id = $1', [chapterId]);
    if (chapterResult.length === 0) {
      throw new NotFoundException('Chapter not found!');
    }

    const query = `
      UPDATE "Chapter"
      SET title = $1, content = $2, "order" = $3
      WHERE id = $4 AND "storyId" = $5
      RETURNING *;
    `;
    const values = [title, content, order, chapterId, storyId];
    const updatedChapterResult = await this.dataSource.query(query, values);

    // Invalidate caches and proactively refresh with updated data
    await this.cacheService.del('chapter-' + chapterId.toString());
    await this.cacheService.del('story-' + storyId.toString());
    this.refreshChapterCache(chapterId).catch(() => {});
    this.refreshStoryCache(storyId).catch(() => {});

    return updatedChapterResult[0];
  }

  async deleteChapter(chapterId: string, userId: string): Promise<Chapter> {
    const chapterResult = await this.dataSource.query('SELECT "storyId" FROM "Chapter" WHERE id = $1', [chapterId]);
    const chapter = chapterResult[0];

    if (!chapter) {
      throw new NotFoundException('Chapter not found!');
    }

    const storyResult = await this.dataSource.query('SELECT "authorId" FROM "Story" WHERE id = $1', [chapter.storyId]);
    const story = storyResult[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException("You don't have permission to delete this chapter!");
    }

    const deletedChapterResult = await this.dataSource.query('DELETE FROM "Chapter" WHERE id = $1 RETURNING *', [chapterId]);

    // Invalidate caches and proactively refresh story data
    await this.cacheService.del('chapter-' + chapterId.toString());
    await this.cacheService.del('story-' + chapter.storyId.toString());
    this.refreshStoryCache(chapter.storyId.toString()).catch(() => {});

    return deletedChapterResult[0];
  }

  private async createReadHistory(readUserId: string, storyId: string, chapterId: string) {
    const query = `
      INSERT INTO "ReadHistory" ("userId", "storyId", "chapterId", date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("storyId", "userId")
      DO UPDATE SET "chapterId" = $3, date = $4;
    `;
    await this.dataSource.query(query, [readUserId, storyId, chapterId, new Date()]);
  }

  private async checkIsPrivateStory(readUserId: string, storyId: string){
    const storyResult = await this.dataSource.query('SELECT "authorId" FROM "Story" WHERE id = $1 AND isprivate = true', [storyId]);
    const story = storyResult[0];

    if(story && story.authorId != readUserId){
      throw new ForbiddenException("You don't have permission to read this chapter!");
    }
  }

  private async refreshStoryCache(storyId: string): Promise<void> {
    // Fetch updated story data and warm the cache
    const storyQuery = `
      SELECT s.*, u.username as "authorUsername"
      FROM "Story" s
      LEFT JOIN "User" u ON s."authorId" = u.id
      WHERE s.id = $1
    `;
    const storyResult = await this.dataSource.query(storyQuery, [storyId]);
    if (storyResult.length > 0) {
      const story = storyResult[0];
      story.author = { username: story.authorUsername };
      
      // Fetch related data
      const chaptersResult = await this.dataSource.query(
        'SELECT id, title, "order", "storyId", "dateCreated" FROM "Chapter" WHERE "storyId" = $1 ORDER BY "order" DESC',
        [storyId]
      );
      story.chapters = chaptersResult;
      
      const tagsResult = await this.dataSource.query(
        `SELECT t.name FROM "Tag" t
         INNER JOIN "TagStory" ts ON t.id = ts."tagId"
         WHERE ts."storyId" = $1
         ORDER BY t.category ASC, t.name ASC`,
        [storyId]
      );
      story.tags = tagsResult.map(row => row.name);
      
      await this.cacheService.set('story-' + storyId, story);
    }
  }

  private async refreshChapterCache(chapterId: string): Promise<void> {
    // Fetch updated chapter data and warm the cache
    const chapterQuery = `
      SELECT c.*, s."authorId" as "storyAuthorId", s.isprivate as "storyIsPrivate"
      FROM "Chapter" c 
      JOIN "Story" s ON c."storyId" = s.id
      WHERE c.id = $1
    `;
    const chapterResult = await this.dataSource.query(chapterQuery, [chapterId]);
    if (chapterResult.length > 0) {
      const chapter = chapterResult[0];
      
      const commentsResult = await this.dataSource.query(
        `SELECT cc.*, u.username as "authorUsername"
         FROM "StoryComment" cc
         LEFT JOIN "User" u ON cc."authorId" = u.id
         WHERE cc."chapterId" = $1
         ORDER BY cc."dateCreated" DESC`,
        [chapterId]
      );
      chapter.chapterComments = commentsResult.map(comment => ({
        ...comment,
        author: { username: comment.authorUsername }
      }));
      
      await this.cacheService.set('chapter-' + chapterId, chapter);
    }
  }
}
