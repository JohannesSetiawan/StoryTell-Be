import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { ChapterDto, Chapter } from './chapter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getDateInWIB } from '../utils/date';

@Injectable()
export class ChapterService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createChapter(data: ChapterDto, userId: string): Promise<Chapter> {
    const { storyId, title, content, order } = data;

    const storyResult = await this.pool.query('SELECT "authorId" FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult.rows[0];

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
    const newChapterResult = await this.pool.query(query, values);

    await this.cacheService.del('story-' + storyId.toString());

    return newChapterResult.rows[0];
  }

  async getAllChapterForStory(storyId: string): Promise<Chapter[]> {
    const query = 'SELECT id, title, content, "order", "storyId", "dateCreated" FROM "Chapter" WHERE "storyId" = $1 ORDER BY "order" ASC';
    const chaptersResult = await this.pool.query(query, [storyId]);
    return chaptersResult.rows;
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
    const chapterResult = await this.pool.query(chapterQuery, [id]);
    const chapter = chapterResult.rows[0];

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
    const commentsResult = await this.pool.query(commentsQuery, [id]);
    chapter.chapterComments = commentsResult.rows.map(comment => ({
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

    const storyResult = await this.pool.query('SELECT "authorId" FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult.rows[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException("You don't have permission to update this chapter!");
    }

    const chapterResult = await this.pool.query('SELECT id FROM "Chapter" WHERE id = $1', [chapterId]);
    if (chapterResult.rows.length === 0) {
      throw new NotFoundException('Chapter not found!');
    }

    const query = `
      UPDATE "Chapter"
      SET title = $1, content = $2, "order" = $3
      WHERE id = $4 AND "storyId" = $5
      RETURNING *;
    `;
    const values = [title, content, order, chapterId, storyId];
    const updatedChapterResult = await this.pool.query(query, values);

    await this.cacheService.del('chapter-' + chapterId.toString());
    await this.cacheService.del('story-' + storyId.toString());

    return updatedChapterResult.rows[0];
  }

  async deleteChapter(chapterId: string, userId: string): Promise<Chapter> {
    const chapterResult = await this.pool.query('SELECT "storyId" FROM "Chapter" WHERE id = $1', [chapterId]);
    const chapter = chapterResult.rows[0];

    if (!chapter) {
      throw new NotFoundException('Chapter not found!');
    }

    const storyResult = await this.pool.query('SELECT "authorId" FROM "Story" WHERE id = $1', [chapter.storyId]);
    const story = storyResult.rows[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException("You don't have permission to delete this chapter!");
    }

    const deletedChapterResult = await this.pool.query('DELETE FROM "Chapter" WHERE id = $1 RETURNING *', [chapterId]);

    await this.cacheService.del('chapter-' + chapterId.toString());
    await this.cacheService.del('story-' + chapter.storyId.toString());

    return deletedChapterResult.rows[0];
  }

  private async createReadHistory(readUserId: string, storyId: string, chapterId: string) {
    const query = `
      INSERT INTO "ReadHistory" ("userId", "storyId", "chapterId", date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("storyId", "userId")
      DO UPDATE SET "chapterId" = $3, date = $4;
    `;
    await this.pool.query(query, [readUserId, storyId, chapterId, new Date()]);
  }

  private async checkIsPrivateStory(readUserId: string, storyId: string){
    const storyResult = await this.pool.query('SELECT "authorId" FROM "Story" WHERE id = $1 AND isprivate = true', [storyId]);
    const story = storyResult.rows[0];

    if(story && story.authorId != readUserId){
      throw new ForbiddenException("You don't have permission to read this chapter!");
    }
  }
}
