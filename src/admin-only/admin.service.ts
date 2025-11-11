import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AdminAllChapterResponseDto, AdminAllCommentResponseDto, AdminAllStoryResponseDto, AdminAllUserResponseDto, ChapterFilterDto, CommentFilterDto, PaginatedResponseDto, StoryFilterDto, UserFilterDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
  ) {}

  async getAllUser(filters: UserFilterDto): Promise<PaginatedResponseDto<AdminAllUserResponseDto>>{
    const { page = 1, limit = 10, username, isAdmin } = filters;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (username) {
      conditions.push(`username ILIKE $${paramIndex}`);
      params.push(`%${username}%`);
      paramIndex++;
    }

    if (isAdmin !== undefined) {
      conditions.push(`"isAdmin" = $${paramIndex}`);
      params.push(isAdmin);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM "User" ${whereClause}`;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const query = `
      SELECT id, username, description, "dateCreated", "isAdmin" 
      FROM "User" 
      ${whereClause}
      ORDER BY "dateCreated" DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await this.pool.query(query, [...params, limit, offset]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getAllStories(filters: StoryFilterDto): Promise<PaginatedResponseDto<AdminAllStoryResponseDto>>{
    const { page = 1, limit = 10, title, author, isPrivate } = filters;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title) {
      conditions.push(`s.title ILIKE $${paramIndex}`);
      params.push(`%${title}%`);
      paramIndex++;
    }

    if (author) {
      conditions.push(`u.username ILIKE $${paramIndex}`);
      params.push(`%${author}%`);
      paramIndex++;
    }

    if (isPrivate !== undefined) {
      conditions.push(`s."isprivate" = $${paramIndex}`);
      params.push(isPrivate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM "Story" s
      LEFT JOIN "User" u ON s."authorId" = u.id
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const query = `
      SELECT s.id, s.title, s.description, s."dateCreated", s."authorId", s."isprivate", u.username as "authorUsername"
      FROM "Story" s
      LEFT JOIN "User" u ON s."authorId" = u.id
      ${whereClause}
      ORDER BY s."dateCreated" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await this.pool.query(query, [...params, limit, offset]);
    
    const stories: AdminAllStoryResponseDto[] = result.rows;
    for (const story of stories) {
      const chaptersResult = await this.pool.query('SELECT * FROM "Chapter" WHERE "storyId" = $1 ORDER BY "order" ASC', [story.id]);
      story.chapters = chaptersResult.rows;
      story.author = { username: story['authorUsername'] };
    }
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: stories,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getAllChapters(filters: ChapterFilterDto): Promise<PaginatedResponseDto<AdminAllChapterResponseDto>>{
    const { page = 1, limit = 10, story, author, content } = filters;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (story) {
      conditions.push(`s.title ILIKE $${paramIndex}`);
      params.push(`%${story}%`);
      paramIndex++;
    }

    if (author) {
      conditions.push(`u.username ILIKE $${paramIndex}`);
      params.push(`%${author}%`);
      paramIndex++;
    }

    if (content) {
      conditions.push(`c.content ILIKE $${paramIndex}`);
      params.push(`%${content}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM "Chapter" c
      LEFT JOIN "Story" s ON c."storyId" = s.id
      LEFT JOIN "User" u ON s."authorId" = u.id
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const query = `
      SELECT c.*, s.title as "storyTitle", u.username as "authorUsername", u.id as "authorId"
      FROM "Chapter" c
      LEFT JOIN "Story" s ON c."storyId" = s.id
      LEFT JOIN "User" u ON s."authorId" = u.id
      ${whereClause}
      ORDER BY c."dateCreated" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await this.pool.query(query, [...params, limit, offset]);
    
    const chapters = result.rows.map(chapter => ({
      ...chapter,
      story: {
        title: chapter.storyTitle,
        author: {
          username: chapter.authorUsername,
          id: chapter.authorId
        }
      }
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: chapters,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getAllComments(filters: CommentFilterDto): Promise<PaginatedResponseDto<AdminAllCommentResponseDto>>{
    const { page = 1, limit = 10, content, author, story, chapter } = filters;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (content) {
      conditions.push(`sc.content ILIKE $${paramIndex}`);
      params.push(`%${content}%`);
      paramIndex++;
    }

    if (author) {
      conditions.push(`u.username ILIKE $${paramIndex}`);
      params.push(`%${author}%`);
      paramIndex++;
    }

    if (story) {
      conditions.push(`s.title ILIKE $${paramIndex}`);
      params.push(`%${story}%`);
      paramIndex++;
    }

    if (chapter) {
      conditions.push(`c.title ILIKE $${paramIndex}`);
      params.push(`%${chapter}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM "StoryComment" sc
      LEFT JOIN "User" u ON sc."authorId" = u.id
      LEFT JOIN "Story" s ON sc."storyId" = s.id
      LEFT JOIN "Chapter" c ON sc."chapterId" = c.id
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data with joined user and story info
    const query = `
      SELECT 
        sc.*,
        u.username as "authorUsername",
        s.title as "storyTitle",
        c.title as "chapterTitle"
      FROM "StoryComment" sc
      LEFT JOIN "User" u ON sc."authorId" = u.id
      LEFT JOIN "Story" s ON sc."storyId" = s.id
      LEFT JOIN "Chapter" c ON sc."chapterId" = c.id
      ${whereClause}
      ORDER BY sc."dateCreated" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await this.pool.query(query, [...params, limit, offset]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
