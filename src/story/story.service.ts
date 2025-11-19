import { Injectable, Inject, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import { StoryDto, Story } from './story.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getDateInWIB } from '../utils/date';

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
    @Inject('DATABASE_POOL') private pool: Pool,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createStory(data: StoryDto, authorId: string): Promise<Story> {
    const { title, description, isprivate, tagIds, storyStatus } = data;
    const query = `
      INSERT INTO "Story" (title, description, "authorId", isprivate, "storyStatus")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [title, description, authorId, isprivate, storyStatus || 'Ongoing'];
    const result = await this.pool.query(query, values);
    const story = result.rows[0];

    // Assign tags if provided
    if (tagIds && tagIds.length > 0) {
      const insertTagPromises = tagIds.map(tagId =>
        this.pool.query(
          'INSERT INTO "TagStory" ("tagId", "storyId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [tagId, story.id]
        )
      );
      await Promise.all(insertTagPromises);
    }

    return story;
  }

  async getAllStories(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    sort?: SortOption,
    tagIds?: string[],
  ): Promise<PaginatedResult<Story>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    let whereClause = 's.isprivate = false';
    const queryParams: any[] = [];
    let fromClause = '"Story" s';
    
    // Add tag filtering if tagIds are provided
    if (tagIds && tagIds.length > 0) {
      queryParams.push(tagIds);
      fromClause = `
        "Story" s
        INNER JOIN "TagStory" ts ON s.id = ts."storyId"
        INNER JOIN "Tag" t ON ts."tagId" = t.id
      `;
      whereClause += ` AND t.id = ANY($${queryParams.length})`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND s.title ILIKE $${queryParams.length}`;
    }

    let orderByClause = `s."dateCreated" DESC`;
    switch (sort) {
      case 'oldest':
        orderByClause = `s."dateCreated" ASC`;
        break;
      case 'title-asc':
        orderByClause = 's.title ASC';
        break;
      case 'title-desc':
        orderByClause = 's.title DESC';
        break;
    }

    const countQuery = `SELECT COUNT(DISTINCT s.id) FROM ${fromClause} WHERE ${whereClause}`;
    const totalResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    queryParams.push(take, skip);
    const dataQuery = `
      SELECT DISTINCT s.*, u.username as "authorUsername"
      FROM ${fromClause}
      LEFT JOIN "User" u ON s."authorId" = u.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const storiesResult = await this.pool.query(dataQuery, queryParams);
    const stories = storiesResult.rows.map(story => ({
      ...story,
      author: { username: story.authorUsername }
    }));
    
    // Fetch tags for all stories in a single query to avoid N+1
    if (stories.length > 0) {
      const storyIds = stories.map(story => story.id);
      const tagsQuery = `
        SELECT ts."storyId", t.name 
        FROM "Tag" t
        INNER JOIN "TagStory" ts ON t.id = ts."tagId"
        WHERE ts."storyId" = ANY($1)
        ORDER BY ts."storyId", t.category ASC, t.name ASC
      `;
      const tagsResult = await this.pool.query(tagsQuery, [storyIds]);
      
      // Group tags by story ID
      const tagsByStoryId = tagsResult.rows.reduce((acc, row) => {
        if (!acc[row.storyId]) {
          acc[row.storyId] = [];
        }
        acc[row.storyId].push(row.name);
        return acc;
      }, {} as Record<string, string[]>);
      
      // Assign tags to each story
      stories.forEach(story => {
        story.tags = tagsByStoryId[story.id] || [];
      });
    }

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

  async getSpecificStory(id: string, readUserId: string): Promise<Story> {
    const cachedStoryData = await this.cacheService.get<Story>(
      'story-' + id.toString(),
    );

    if (cachedStoryData) {
      this.checkIsPrivateStory(cachedStoryData, readUserId);
      if(readUserId) await this.createReadHistory(readUserId, id);
      return cachedStoryData;
    }

    const storyQuery = `
      SELECT s.*, u.username as "authorUsername"
      FROM "Story" s
      LEFT JOIN "User" u ON s."authorId" = u.id
      WHERE s.id = $1
    `;
    const storyResult = await this.pool.query(storyQuery, [id]);
    const story = storyResult.rows[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }
    
    story.author = { username: story.authorUsername };

    const chaptersQuery = 'SELECT id, title, "order", "storyId", "dateCreated" FROM "Chapter" WHERE "storyId" = $1 ORDER BY "order" DESC';
    const chaptersResult = await this.pool.query(chaptersQuery, [id]);
    story.chapters = chaptersResult.rows;

    const commentsQuery = `
      SELECT sc.*, u.username as "authorUsername"
      FROM "StoryComment" sc
      LEFT JOIN "User" u ON sc."authorId" = u.id
      WHERE sc."storyId" = $1 AND sc."chapterId" IS NULL
      ORDER BY sc."dateCreated" DESC
    `;
    const commentsResult = await this.pool.query(commentsQuery, [id]);
    story.storyComments = commentsResult.rows.map(comment => ({
      ...comment,
      author: { username: comment.authorUsername }
    }));

    // Fetch tags for the story
    const tagsQuery = `
      SELECT t.name 
      FROM "Tag" t
      INNER JOIN "TagStory" ts ON t.id = ts."tagId"
      WHERE ts."storyId" = $1
      ORDER BY t.category ASC, t.name ASC
    `;
    const tagsResult = await this.pool.query(tagsQuery, [id]);
    story.tags = tagsResult.rows.map(row => row.name);

    this.checkIsPrivateStory(story, readUserId);

    if(readUserId) await this.createReadHistory(readUserId, id);

    await this.cacheService.set('story-' + id.toString(), story);
    return story;
  }

  async getSpecificUserStories(
    userId: string,
    page: number = 1,
    perPage: number = 10,
    search?: string,
    sort?: SortOption,
    tagIds?: string[],
  ): Promise<PaginatedResult<Story>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    let whereClause = 's."authorId" = $1';
    const queryParams: any[] = [userId];
    let fromClause = '"Story" s';
    
    // Add tag filtering if tagIds are provided
    if (tagIds && tagIds.length > 0) {
      queryParams.push(tagIds);
      fromClause = `
        "Story" s
        INNER JOIN "TagStory" ts ON s.id = ts."storyId"
        INNER JOIN "Tag" t ON ts."tagId" = t.id
      `;
      whereClause += ` AND t.id = ANY($${queryParams.length})`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND s.title ILIKE $${queryParams.length}`;
    }

    let orderByClause = `s."dateCreated" DESC`;
    switch (sort) {
      case 'oldest':
        orderByClause = `s."dateCreated" ASC`;
        break;
      case 'title-asc':
        orderByClause = 's.title ASC';
        break;
      case 'title-desc':
        orderByClause = 's.title DESC';
        break;
    }

    const countQuery = `SELECT COUNT(DISTINCT s.id) FROM ${fromClause} WHERE ${whereClause}`;
    const totalResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    queryParams.push(take, skip);
    const dataQuery = `
      SELECT DISTINCT s.*
      FROM ${fromClause}
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const storiesResult = await this.pool.query(dataQuery, queryParams);
    const stories = storiesResult.rows;
    
    // Fetch tags for all stories in a single query to avoid N+1
    if (stories.length > 0) {
      const storyIds = stories.map(story => story.id);
      const tagsQuery = `
        SELECT ts."storyId", t.name 
        FROM "Tag" t
        INNER JOIN "TagStory" ts ON t.id = ts."tagId"
        WHERE ts."storyId" = ANY($1)
        ORDER BY ts."storyId", t.category ASC, t.name ASC
      `;
      const tagsResult = await this.pool.query(tagsQuery, [storyIds]);
      
      // Group tags by story ID
      const tagsByStoryId = tagsResult.rows.reduce((acc, row) => {
        if (!acc[row.storyId]) {
          acc[row.storyId] = [];
        }
        acc[row.storyId].push(row.name);
        return acc;
      }, {} as Record<string, string[]>);
      
      // Assign tags to each story
      stories.forEach(story => {
        story.tags = tagsByStoryId[story.id] || [];
      });
    }

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

  async getPublicStoriesByUsername(
    username: string,
    page: number = 1,
    perPage: number = 10,
    search?: string,
    sort?: SortOption,
    tagIds?: string[],
  ): Promise<PaginatedResult<Story>> {
    // First get the user ID from username
    const userResult = await this.pool.query(
      'SELECT id FROM "User" WHERE username = $1',
      [username],
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundException('User not found');
    }
    
    const userId = userResult.rows[0].id;
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    let whereClause = 's."authorId" = $1 AND s.isprivate = false';
    const queryParams: any[] = [userId];
    let fromClause = '"Story" s';
    
    // Add tag filtering if tagIds are provided
    if (tagIds && tagIds.length > 0) {
      queryParams.push(tagIds);
      fromClause = `
        "Story" s
        INNER JOIN "TagStory" ts ON s.id = ts."storyId"
        INNER JOIN "Tag" t ON ts."tagId" = t.id
      `;
      whereClause += ` AND t.id = ANY($${queryParams.length})`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND s.title ILIKE $${queryParams.length}`;
    }

    let orderByClause = `s."dateCreated" DESC`;
    switch (sort) {
      case 'oldest':
        orderByClause = `s."dateCreated" ASC`;
        break;
      case 'title-asc':
        orderByClause = 's.title ASC';
        break;
      case 'title-desc':
        orderByClause = 's.title DESC';
        break;
    }

    const countQuery = `SELECT COUNT(DISTINCT s.id) FROM ${fromClause} WHERE ${whereClause}`;
    const totalResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    queryParams.push(take, skip);
    const dataQuery = `
      SELECT DISTINCT s.*, u.username as "authorUsername"
      FROM ${fromClause}
      LEFT JOIN "User" u ON s."authorId" = u.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const storiesResult = await this.pool.query(dataQuery, queryParams);
    const stories = storiesResult.rows.map(story => ({
      ...story,
      author: { username: story.authorUsername }
    }));
    
    // Fetch tags for all stories in a single query to avoid N+1
    if (stories.length > 0) {
      const storyIds = stories.map(story => story.id);
      const tagsQuery = `
        SELECT ts."storyId", t.name 
        FROM "Tag" t
        INNER JOIN "TagStory" ts ON t.id = ts."tagId"
        WHERE ts."storyId" = ANY($1)
        ORDER BY ts."storyId", t.category ASC, t.name ASC
      `;
      const tagsResult = await this.pool.query(tagsQuery, [storyIds]);
      
      // Group tags by story ID
      const tagsByStoryId = tagsResult.rows.reduce((acc, row) => {
        if (!acc[row.storyId]) {
          acc[row.storyId] = [];
        }
        acc[row.storyId].push(row.name);
        return acc;
      }, {} as Record<string, string[]>);
      
      // Assign tags to each story
      stories.forEach(story => {
        story.tags = tagsByStoryId[story.id] || [];
      });
    }

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

  async updateStory(storyId: string, userId: string, data: Partial<StoryDto>): Promise<Story> {
    const storyResult = await this.pool.query('SELECT id, "authorId", "storyStatus" FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult.rows[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to update this story!",
      );
    }

    const { title, description, isprivate, tagIds, storyStatus } = data;
    const query = `
      UPDATE "Story"
      SET title = $1, description = $2, isprivate = $3, "storyStatus" = $4
      WHERE id = $5
      RETURNING *;
    `;
    const values = [title, description, isprivate, storyStatus || story.storyStatus, storyId];
    const updatedResult = await this.pool.query(query, values);

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tags
      await this.pool.query('DELETE FROM "TagStory" WHERE "storyId" = $1', [storyId]);
      
      // Insert new tags
      if (tagIds.length > 0) {
        const insertTagPromises = tagIds.map(tagId =>
          this.pool.query(
            'INSERT INTO "TagStory" ("tagId", "storyId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [tagId, storyId]
          )
        );
        await Promise.all(insertTagPromises);
      }
    }

    // Invalidate cache and proactively refresh with updated data
    await this.cacheService.del('story-' + storyId.toString());
    const updatedStory = await this.getSpecificStory(storyId, userId);

    return updatedResult.rows[0];
  }

  async deleteStory(storyId: string, userId: string): Promise<Story> {
    const storyResult = await this.pool.query('SELECT id, "authorId" FROM "Story" WHERE id = $1', [storyId]);
    const story = storyResult.rows[0];

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to delete this story!",
      );
    }

    const deletedResult = await this.pool.query('DELETE FROM "Story" WHERE id = $1 RETURNING *', [storyId]);

    await this.cacheService.del('story-' + storyId.toString());

    return deletedResult.rows[0];
  }

  private async createReadHistory(readUserId: string, id: string) {
    const query = `
      INSERT INTO "ReadHistory" ("userId", "storyId", date)
      VALUES ($1, $2, $3)
      ON CONFLICT ("storyId", "userId")
      DO UPDATE SET date = $3;
    `;
    await this.pool.query(query, [readUserId, id, new Date()]);
  }

  async getStoryDetails(storyId: string, userId: string) {
    // Get story with all related data
    const story = await this.getSpecificStory(storyId, userId);

    // Get ratings aggregation
    const ratingsQuery = `
      SELECT 
        COUNT(rate) as count,
        AVG(rate) as avg,
        SUM(rate) as sum
      FROM "Rating"
      WHERE "storyId" = $1
      GROUP BY "storyId";
    `;
    const ratingsResult = await this.pool.query(ratingsQuery, [storyId]);
    const ratings = ratingsResult.rows.length === 0 ? {
      _count: { rate: 0 },
      _avg: { rate: 0 },
      _sum: { rate: 0 }
    } : {
      _count: { rate: parseInt(ratingsResult.rows[0].count, 10) },
      _avg: { rate: parseFloat(ratingsResult.rows[0].avg) },
      _sum: { rate: parseInt(ratingsResult.rows[0].sum, 10) }
    };

    // Get user's rating
    const userRatingQuery = 'SELECT id, "authorId", "storyId", rate FROM "Rating" WHERE "storyId" = $1 AND "authorId" = $2';
    const userRatingResult = await this.pool.query(userRatingQuery, [storyId, userId]);
    const userRating = userRatingResult.rows.length === 0 ? {
      id: null,
      authorId: null,
      storyId: null,
      rate: null,
      message: "You have not rated this story yet."
    } : userRatingResult.rows[0];

    // Get read history
    const historyQuery = `
      SELECT 
        rh.id,
        rh."userId",
        rh."storyId",
        rh."chapterId",
        rh.date,
        s.title as "storyTitle",
        c.title as "chapterTitle",
        c.order as "chapterOrder"
      FROM "ReadHistory" rh
      LEFT JOIN "Story" s ON rh."storyId" = s.id
      LEFT JOIN "Chapter" c ON rh."chapterId" = c.id
      WHERE rh."userId" = $1 AND rh."storyId" = $2;
    `;
    const historyResult = await this.pool.query(historyQuery, [userId, storyId]);
    const history = historyResult.rows[0] ? {
      id: historyResult.rows[0].id,
      userId: historyResult.rows[0].userId,
      storyId: historyResult.rows[0].storyId,
      chapterId: historyResult.rows[0].chapterId,
      date: historyResult.rows[0].date,
      story: { title: historyResult.rows[0].storyTitle },
      ...(historyResult.rows[0].chapterTitle && {
        chapter: {
          title: historyResult.rows[0].chapterTitle,
          order: historyResult.rows[0].chapterOrder
        }
      })
    } : null;

    // Check bookmark status
    const bookmarkQuery = 'SELECT id FROM "Bookmark" WHERE "userId" = $1 AND "storyId" = $2';
    const bookmarkResult = await this.pool.query(bookmarkQuery, [userId, storyId]);
    const isBookmarked = bookmarkResult.rows.length > 0;

    // Get story tags (already included in story object)
    const tagsQuery = `
      SELECT t.id, t.name, t.category, t."dateCreated" 
      FROM "Tag" t
      INNER JOIN "TagStory" ts ON t.id = ts."tagId"
      WHERE ts."storyId" = $1
      ORDER BY t.category ASC, t.name ASC
    `;
    const tagsResult = await this.pool.query(tagsQuery, [storyId]);
    const storyTags = tagsResult.rows;

    return {
      story,
      ratings,
      userRating,
      history,
      isBookmarked,
      storyTags
    };
  }

  private checkIsPrivateStory(story: Story, readUserId: string) {
    if (story.isPrivate) {
      if (!readUserId || readUserId !== story.authorId) {
        throw new UnauthorizedException("You can't access this private story!");
      }
    }
  }
}
