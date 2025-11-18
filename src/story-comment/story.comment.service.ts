import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Pool } from 'pg';
import { StoryCommentDto, StoryComment } from './story.comment.dto';

@Injectable()
export class StoryCommentService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createStoryComment(
    data: StoryCommentDto,
    userId: string,
    storyId: string,
  ): Promise<StoryComment> {
    const { content, parentId } = data;
    const query = `
      INSERT INTO "StoryComment" ("storyId", content, "authorId", "parentId")
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [storyId, content, userId, parentId];
    const result = await this.pool.query(query, values);

    await this.cacheService.del('story-' + storyId.toString());

    return result.rows[0];
  }

  async createChapterComment(
    data: StoryCommentDto,
    userId: string,
    storyId: string,
    chapterId: string
  ): Promise<StoryComment> {
    const { content, parentId } = data;
    const query = `
      INSERT INTO "StoryComment" ("storyId", "chapterId", content, "authorId", "parentId")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [storyId, chapterId, content, userId, parentId];
    const result = await this.pool.query(query, values);

    await this.cacheService.del('story-' + storyId.toString());
    await this.cacheService.del('chapter-' + chapterId.toString());

    return result.rows[0];
  }

  async getAllStoryCommentForStory(storyId: string): Promise<StoryComment[]> {
    const query = `
      SELECT sc.*, u.username as "authorUsername"
      FROM "StoryComment" sc
      LEFT JOIN "User" u ON sc."authorId" = u.id
      WHERE sc."storyId" = $1
      ORDER BY sc."dateCreated" ASC;
    `;
    const result = await this.pool.query(query, [storyId]);
    return result.rows.map(comment => ({
      ...comment,
      author: { username: comment.authorUsername }
    }));
  }

  async getSpecificCommentForStory(commentId: string): Promise<StoryComment> {
    const query = 'SELECT id, content, "authorId", "storyId", "chapterId", "parentId", "dateCreated" FROM "StoryComment" WHERE id = $1';
    const result = await this.pool.query(query, [commentId]);
    return result.rows[0];
  }

  async updateComment(
    commentId: string,
    userId: string,
    storyId: string,
    data: StoryCommentDto,
  ): Promise<StoryComment> {
    const commentResult = await this.pool.query('SELECT id, "authorId", "chapterId" FROM "StoryComment" WHERE id = $1 AND "storyId" = $2', [commentId, storyId]);
    const comment = commentResult.rows[0];

    if (!comment) {
      throw new NotFoundException('Comment not found!');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to change this comment!',
      );
    }

    const { content } = data;
    const query = `
      UPDATE "StoryComment"
      SET content = $1
      WHERE id = $2 AND "authorId" = $3 AND "storyId" = $4
      RETURNING *;
    `;
    const values = [content, commentId, userId, storyId];
    const updatedResult = await this.pool.query(query, values);

    await this.cacheService.del('story-' + storyId.toString());
    if (comment.chapterId) {
      await this.cacheService.del('chapter-' + comment.chapterId.toString());
    }

    return updatedResult.rows[0];
  }

  async deleteComment(commentId: string, userId: string, storyId: string): Promise<StoryComment> {
    const commentResult = await this.pool.query('SELECT id, "authorId", "chapterId" FROM "StoryComment" WHERE id = $1', [commentId]);
    const comment = commentResult.rows[0];

    if (!comment) {
      throw new NotFoundException('Comment not found!');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment!',
      );
    }

    const deletedResult = await this.pool.query('DELETE FROM "StoryComment" WHERE id = $1 AND "authorId" = $2 RETURNING *', [commentId, userId]);

    await this.cacheService.del('story-' + storyId.toString());
    if (comment.chapterId) {
      await this.cacheService.del('chapter-' + comment.chapterId.toString());
    }

    return deletedResult.rows[0];
  }
}
