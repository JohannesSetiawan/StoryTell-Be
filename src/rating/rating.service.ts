import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { RatingDto, Rating, StoryRatingResponseDto, UserRatingResponseDto } from './rating.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RatingService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createRating(data: RatingDto, userId: string, storyId: string): Promise<Rating> {
    const storyResult = await this.pool.query('SELECT "authorId" FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult.rows[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId === userId) {
      throw new BadRequestException("You can't rate your own stories!");
    }

    const ratingResult = await this.pool.query('SELECT id FROM "Rating" WHERE "storyId" = $1 AND "authorId" = $2', [storyId, userId]);
    if (ratingResult.rows.length > 0) {
      throw new BadRequestException('You already rated the story!');
    }

    if (data.rate > 10 || data.rate < 0) {
      throw new BadRequestException("Invalid ratings");
    }

    const query = `
      INSERT INTO "Rating" (rate, "storyId", "authorId")
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [data.rate, storyId, userId];
    const newRatingResult = await this.pool.query(query, values);

    // Invalidate cache and proactively refresh with updated story data
    await this.cacheService.del('story-' + storyId.toString());
    // Fetch and cache the updated story data in the background
    this.refreshStoryCache(storyId).catch(() => {});

    return newRatingResult.rows[0];
  }

  async getAllRatingForStory(storyId: string): Promise<StoryRatingResponseDto> {
    const query = `
      SELECT 
        COUNT(rate) as count,
        AVG(rate) as avg,
        SUM(rate) as sum
      FROM "Rating"
      WHERE "storyId" = $1
      GROUP BY "storyId";
    `;
    const result = await this.pool.query(query, [storyId]);

    if (result.rows.length === 0) {
      return {
        _count: { rate: 0 },
        _avg: { rate: 0 },
        _sum: { rate: 0 }
      };
    } else {
      const row = result.rows[0];
      return {
        _count: { rate: parseInt(row.count, 10) },
        _avg: { rate: parseFloat(row.avg) },
        _sum: { rate: parseInt(row.sum, 10) }
      };
    }
  }

  async getUserRatingForStory(storyId: string, userId: string): Promise<UserRatingResponseDto> {
    const query = 'SELECT id, "authorId", "storyId", rate FROM "Rating" WHERE "storyId" = $1 AND "authorId" = $2';
    const result = await this.pool.query(query, [storyId, userId]);

    if (result.rows.length === 0) {
      return {
        id: null,
        authorId: null,
        storyId: null,
        rate: null,
        message: "You have not rated this story yet."
      };
    }
    return result.rows[0];
  }

  async updateRating(id: string, userId: string, data: RatingDto): Promise<Rating> {
    const ratingResult = await this.pool.query('SELECT "authorId" FROM "Rating" WHERE id = $1', [id]);
    const rating = ratingResult.rows[0];

    if (!rating) {
      throw new NotFoundException('Rating not found!');
    }

    if (rating.authorId !== userId) {
      throw new ForbiddenException("You don't have permission to update this rating!");
    }

    if (data.rate > 10 || data.rate < 0) {
      throw new BadRequestException("Invalid ratings");
    }

    const query = `
      UPDATE "Rating"
      SET rate = $1
      WHERE id = $2
      RETURNING *;
    `;
    const values = [data.rate, id];
    const updatedRatingResult = await this.pool.query(query, values);

    return updatedRatingResult.rows[0];
  }

  async deleteRating(ratingId: string, userId: string): Promise<Rating> {
    const ratingResult = await this.pool.query('SELECT id FROM "Rating" WHERE id = $1 AND "authorId" = $2', [ratingId, userId]);
    if (ratingResult.rows.length === 0) {
      throw new NotFoundException('Rating not found!');
    }

    const deletedRatingResult = await this.pool.query('DELETE FROM "Rating" WHERE id = $1 RETURNING *', [ratingId]);
    return deletedRatingResult.rows[0];
  }

  private async refreshStoryCache(storyId: string): Promise<void> {
    // Fetch updated story data and warm the cache
    const storyQuery = `
      SELECT s.*, u.username as "authorUsername"
      FROM "Story" s
      LEFT JOIN "User" u ON s."authorId" = u.id
      WHERE s.id = $1
    `;
    const storyResult = await this.pool.query(storyQuery, [storyId]);
    if (storyResult.rows.length > 0) {
      const story = storyResult.rows[0];
      story.author = { username: story.authorUsername };
      
      // Fetch related data
      const chaptersResult = await this.pool.query(
        'SELECT id, title, "order", "storyId", "dateCreated" FROM "Chapter" WHERE "storyId" = $1 ORDER BY "order" DESC',
        [storyId]
      );
      story.chapters = chaptersResult.rows;
      
      const tagsResult = await this.pool.query(
        `SELECT t.name FROM "Tag" t
         INNER JOIN "TagStory" ts ON t.id = ts."tagId"
         WHERE ts."storyId" = $1
         ORDER BY t.category ASC, t.name ASC`,
        [storyId]
      );
      story.tags = tagsResult.rows.map(row => row.name);
      
      await this.cacheService.set('story-' + storyId, story);
    }
  }
}
