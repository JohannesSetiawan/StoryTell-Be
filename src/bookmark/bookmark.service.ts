import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { BookmarkItem } from './bookmark.dto';

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

@Injectable()
export class BookmarkService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async createBookmark(userId: string, storyId: string): Promise<void> {
    const storyCheck = await this.pool.query(
      'SELECT id FROM "Story" WHERE id = $1',
      [storyId]
    );

    if (storyCheck.rows.length === 0) {
      throw new NotFoundException('Story not found');
    }

    const existingBookmark = await this.pool.query(
      'SELECT id FROM "Bookmark" WHERE "userId" = $1 AND "storyId" = $2',
      [userId, storyId]
    );

    if (existingBookmark.rows.length > 0) {
      throw new ConflictException('Story already bookmarked');
    }

    await this.pool.query(
      'INSERT INTO "Bookmark" ("userId", "storyId") VALUES ($1, $2)',
      [userId, storyId]
    );
  }

  async getAllBookmarks(
    userId: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedResult<BookmarkItem>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    const countQuery = `
      SELECT COUNT(*) 
      FROM "Bookmark" b
      WHERE b."userId" = $1
    `;
    const totalResult = await this.pool.query(countQuery, [userId]);
    const total = parseInt(totalResult.rows[0].count, 10);

    const dataQuery = `
      SELECT 
        s.id as "storyId",
        s.title,
        u.username as "authorName",
        s."storyStatus",
        (
          SELECT c.title
          FROM "Chapter" c
          WHERE c."storyId" = s.id
          ORDER BY c."order" DESC
          LIMIT 1
        ) as "latestChapter"
      FROM "Bookmark" b
      INNER JOIN "Story" s ON b."storyId" = s.id
      INNER JOIN "User" u ON s."authorId" = u.id
      WHERE b."userId" = $1
      ORDER BY b."dateCreated" DESC
      LIMIT $2 OFFSET $3
    `;

    const bookmarksResult = await this.pool.query(dataQuery, [userId, take, skip]);
    const bookmarks = bookmarksResult.rows.map(row => ({
      storyId: row.storyId,
      title: row.title,
      authorName: row.authorName,
      storyStatus: row.storyStatus,
      latestChapter: row.latestChapter || null
    }));

    const lastPage = Math.ceil(total / take);

    return {
      data: bookmarks,
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

  async deleteBookmark(userId: string, storyId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM "Bookmark" WHERE "userId" = $1 AND "storyId" = $2 RETURNING id',
      [userId, storyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Bookmark not found');
    }
  }

  async checkBookmarkStatus(userId: string, storyId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM "Bookmark" WHERE "userId" = $1 AND "storyId" = $2',
      [userId, storyId]
    );
    return result.rows.length > 0;
  }
}
