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

  async getPaginatedStoryComments(
    storyId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    comments: StoryComment[];
    total: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;

    // Get total count of root comments
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "StoryComment"
      WHERE "storyId" = $1 AND "chapterId" IS NULL AND "parentId" IS NULL
    `;
    const countResult = await this.pool.query(countQuery, [storyId]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated root comments
    const rootCommentsQuery = `
      SELECT sc.*, u.username as "authorUsername"
      FROM "StoryComment" sc
      LEFT JOIN "User" u ON sc."authorId" = u.id
      WHERE sc."storyId" = $1 AND sc."chapterId" IS NULL AND sc."parentId" IS NULL
      ORDER BY sc."dateCreated" DESC
      LIMIT $2 OFFSET $3
    `;
    const rootResult = await this.pool.query(rootCommentsQuery, [storyId, limit, offset]);
    const rootComments = rootResult.rows.map(comment => ({
      ...comment,
      author: { username: comment.authorUsername }
    }));

    // Get all replies for the root comments
    if (rootComments.length > 0) {
      const rootCommentIds = rootComments.map(c => c.id);
      const repliesQuery = `
        WITH RECURSIVE comment_tree AS (
          SELECT sc.*, u.username as "authorUsername", 1 as depth
          FROM "StoryComment" sc
          LEFT JOIN "User" u ON sc."authorId" = u.id
          WHERE sc."parentId" = ANY($1)
          
          UNION ALL
          
          SELECT sc.*, u.username as "authorUsername", ct.depth + 1
          FROM "StoryComment" sc
          LEFT JOIN "User" u ON sc."authorId" = u.id
          INNER JOIN comment_tree ct ON sc."parentId" = ct.id
        )
        SELECT * FROM comment_tree
        ORDER BY "dateCreated" ASC
      `;
      const repliesResult = await this.pool.query(repliesQuery, [rootCommentIds]);
      const replies = repliesResult.rows.map(comment => ({
        ...comment,
        author: { username: comment.authorUsername }
      }));

      // Combine root comments and their replies
      const allComments = [...rootComments, ...replies];
      return {
        comments: allComments,
        total,
        hasMore: offset + limit < total,
        currentPage: page
      };
    }

    return {
      comments: rootComments,
      total,
      hasMore: false,
      currentPage: page
    };
  }

  async getPaginatedChapterComments(
    storyId: string,
    chapterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    comments: StoryComment[];
    total: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;

    // Get total count of root comments
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "StoryComment"
      WHERE "storyId" = $1 AND "chapterId" = $2 AND "parentId" IS NULL
    `;
    const countResult = await this.pool.query(countQuery, [storyId, chapterId]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated root comments
    const rootCommentsQuery = `
      SELECT sc.*, u.username as "authorUsername"
      FROM "StoryComment" sc
      LEFT JOIN "User" u ON sc."authorId" = u.id
      WHERE sc."storyId" = $1 AND sc."chapterId" = $2 AND sc."parentId" IS NULL
      ORDER BY sc."dateCreated" DESC
      LIMIT $3 OFFSET $4
    `;
    const rootResult = await this.pool.query(rootCommentsQuery, [storyId, chapterId, limit, offset]);
    const rootComments = rootResult.rows.map(comment => ({
      ...comment,
      author: { username: comment.authorUsername }
    }));

    // Get all replies for the root comments
    if (rootComments.length > 0) {
      const rootCommentIds = rootComments.map(c => c.id);
      const repliesQuery = `
        WITH RECURSIVE comment_tree AS (
          SELECT sc.*, u.username as "authorUsername", 1 as depth
          FROM "StoryComment" sc
          LEFT JOIN "User" u ON sc."authorId" = u.id
          WHERE sc."parentId" = ANY($1)
          
          UNION ALL
          
          SELECT sc.*, u.username as "authorUsername", ct.depth + 1
          FROM "StoryComment" sc
          LEFT JOIN "User" u ON sc."authorId" = u.id
          INNER JOIN comment_tree ct ON sc."parentId" = ct.id
        )
        SELECT * FROM comment_tree
        ORDER BY "dateCreated" ASC
      `;
      const repliesResult = await this.pool.query(repliesQuery, [rootCommentIds]);
      const replies = repliesResult.rows.map(comment => ({
        ...comment,
        author: { username: comment.authorUsername }
      }));

      // Combine root comments and their replies
      const allComments = [...rootComments, ...replies];
      return {
        comments: allComments,
        total,
        hasMore: offset + limit < total,
        currentPage: page
      };
    }

    return {
      comments: rootComments,
      total,
      hasMore: false,
      currentPage: page
    };
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
