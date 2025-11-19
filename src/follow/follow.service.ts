import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Pool } from 'pg';
import {
  Follow,
  FollowerWithUser,
  FollowingWithUser,
  FollowStats,
  ActivityFeed,
  ActivityType,
} from './follow.dto';

export interface PaginatedActivityFeed {
  data: ActivityFeed[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}

@Injectable()
export class FollowService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if the user to follow exists
    const userResult = await this.pool.query(
      'SELECT id FROM "User" WHERE id = $1',
      [followingId],
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    try {
      const query = `
        INSERT INTO "Follow" ("followerId", "followingId")
        VALUES ($1, $2)
        RETURNING *;
      `;
      const result = await this.pool.query(query, [followerId, followingId]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('You are already following this user');
      }
      throw error;
    }
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<{ message: string }> {
    const query = `
      DELETE FROM "Follow"
      WHERE "followerId" = $1 AND "followingId" = $2
      RETURNING *;
    `;
    const result = await this.pool.query(query, [followerId, followingId]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Follow relationship not found');
    }

    return { message: 'Successfully unfollowed user' };
  }

  async getFollowers(userId: string): Promise<FollowerWithUser[]> {
    const query = `
      SELECT 
        f.id,
        f."followerId",
        f."followingId",
        f."followedAt",
        u.id as "userId",
        u.username,
        u.description
      FROM "Follow" f
      INNER JOIN "User" u ON f."followerId" = u.id
      WHERE f."followingId" = $1
      ORDER BY f."followedAt" DESC;
    `;
    const result = await this.pool.query(query, [userId]);

    return result.rows.map((row) => ({
      id: row.id,
      followerId: row.followerId,
      followingId: row.followingId,
      followedAt: row.followedAt,
      user: {
        id: row.userId,
        username: row.username,
        description: row.description,
      },
    }));
  }

  async getFollowing(userId: string): Promise<FollowingWithUser[]> {
    const query = `
      SELECT 
        f.id,
        f."followerId",
        f."followingId",
        f."followedAt",
        u.id as "userId",
        u.username,
        u.description
      FROM "Follow" f
      INNER JOIN "User" u ON f."followingId" = u.id
      WHERE f."followerId" = $1
      ORDER BY f."followedAt" DESC;
    `;
    const result = await this.pool.query(query, [userId]);

    return result.rows.map((row) => ({
      id: row.id,
      followerId: row.followerId,
      followingId: row.followingId,
      followedAt: row.followedAt,
      user: {
        id: row.userId,
        username: row.username,
        description: row.description,
      },
    }));
  }

  async checkIfFollowing(
    followerId: string,
    followingId: string,
  ): Promise<{ isFollowing: boolean }> {
    const query = `
      SELECT id FROM "Follow"
      WHERE "followerId" = $1 AND "followingId" = $2;
    `;
    const result = await this.pool.query(query, [followerId, followingId]);

    return { isFollowing: result.rows.length > 0 };
  }

  async getFollowStats(userId: string): Promise<FollowStats> {
    const followersQuery = `
      SELECT COUNT(*) as count FROM "Follow"
      WHERE "followingId" = $1;
    `;
    const followingQuery = `
      SELECT COUNT(*) as count FROM "Follow"
      WHERE "followerId" = $1;
    `;

    const [followersResult, followingResult] = await Promise.all([
      this.pool.query(followersQuery, [userId]),
      this.pool.query(followingQuery, [userId]),
    ]);

    return {
      followersCount: parseInt(followersResult.rows[0].count, 10),
      followingCount: parseInt(followingResult.rows[0].count, 10),
    };
  }

  async getActivityFeed(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PaginatedActivityFeed> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Math.min(100, Number(perPage) || 20));
    const skip = (pageNumber - 1) * take;

    // Get activities from followed users
    const countQuery = `
      SELECT COUNT(*) as count
      FROM "ActivityFeed" af
      INNER JOIN "Follow" f ON af."userId" = f."followingId"
      WHERE f."followerId" = $1;
    `;
    const totalResult = await this.pool.query(countQuery, [userId]);
    const total = parseInt(totalResult.rows[0].count, 10);

    const dataQuery = `
      SELECT 
        af.id,
        af."userId",
        af."activityType",
        af."storyId",
        af."chapterId",
        af.metadata,
        af."createdAt",
        u.id as "authorId",
        u.username as "authorUsername",
        s.id as "storyIdData",
        s.title as "storyTitle",
        c.id as "chapterIdData",
        c.title as "chapterTitle",
        c."order" as "chapterOrder"
      FROM "ActivityFeed" af
      INNER JOIN "Follow" f ON af."userId" = f."followingId"
      INNER JOIN "User" u ON af."userId" = u.id
      LEFT JOIN "Story" s ON af."storyId" = s.id
      LEFT JOIN "Chapter" c ON af."chapterId" = c.id
      WHERE f."followerId" = $1
      ORDER BY af."createdAt" DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await this.pool.query(dataQuery, [userId, take, skip]);

    const activities: ActivityFeed[] = result.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      activityType: row.activityType as ActivityType,
      storyId: row.storyId,
      chapterId: row.chapterId,
      metadata: row.metadata,
      createdAt: row.createdAt,
      user: {
        id: row.authorId,
        username: row.authorUsername,
      },
      ...(row.storyIdData && {
        story: {
          id: row.storyIdData,
          title: row.storyTitle,
        },
      }),
      ...(row.chapterIdData && {
        chapter: {
          id: row.chapterIdData,
          title: row.chapterTitle,
          order: row.chapterOrder,
        },
      }),
    }));

    const lastPage = Math.ceil(total / take);

    return {
      data: activities,
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

  async createActivity(
    userId: string,
    activityType: ActivityType,
    storyId?: string,
    chapterId?: string,
    metadata?: any,
  ): Promise<ActivityFeed> {
    const query = `
      INSERT INTO "ActivityFeed" ("userId", "activityType", "storyId", "chapterId", metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      userId,
      activityType,
      storyId || null,
      chapterId || null,
      metadata ? JSON.stringify(metadata) : null,
    ]);

    return result.rows[0];
  }
}
