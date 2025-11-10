import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AdminAllChapterResponseDto, AdminAllCommentResponseDto, AdminAllStoryResponseDto, AdminAllUserResponseDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
  ) {}

  async getAllUser(): Promise<AdminAllUserResponseDto[]>{
    const result = await this.pool.query('SELECT id, username, description, "dateCreated", "isAdmin" FROM "User"');
    return result.rows;
  }

  async getAllStories(): Promise<AdminAllStoryResponseDto[]>{
    const query = `
      SELECT s.id, s.title, s.description, s."dateCreated", s."authorId", s."isprivate", u.username as "authorUsername"
      FROM "Story" s
      LEFT JOIN "User" u ON s."authorId" = u.id
    `;
    const result = await this.pool.query(query);
    
    const stories: AdminAllStoryResponseDto[] = result.rows;
    for (const story of stories) {
      const chaptersResult = await this.pool.query('SELECT * FROM "Chapter" WHERE "storyId" = $1 ORDER BY "dateCreated" DESC', [story.id]);
      story.chapters = chaptersResult.rows;
      story.author = { username: story['authorUsername'] };
    }
    return stories;
  }

  async getAllChapters(): Promise<AdminAllChapterResponseDto[]>{
    const query = `
      SELECT c.*, s.title as "storyTitle", u.username as "authorUsername", u.id as "authorId"
      FROM "Chapter" c
      LEFT JOIN "Story" s ON c."storyId" = s.id
      LEFT JOIN "User" u ON s."authorId" = u.id;
    `;
    const result = await this.pool.query(query);
    return result.rows.map(chapter => ({
      ...chapter,
      story: {
        title: chapter.storyTitle,
        author: {
          username: chapter.authorUsername,
          id: chapter.authorId
        }
      }
    }));
  }

  async getAllComments(): Promise<AdminAllCommentResponseDto[]>{
    const result = await this.pool.query('SELECT * FROM "StoryComment"');
    return result.rows;
  }
}
