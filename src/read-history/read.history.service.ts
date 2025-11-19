import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReadHistoryResponseDto, SpecificReadHistoryResponseDto } from './read.history.dto';

@Injectable()
export class ReadHistoryService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getHistories(userId: string): Promise<ReadHistoryResponseDto[]> {
    const query = `
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
      WHERE rh."userId" = $1
      ORDER BY rh.date DESC;
    `;
    const result = await this.dataSource.query(query, [userId]);
    return result.map(history => ({
      id: history.id,
      userId: history.userId,
      storyId: history.storyId,
      chapterId: history.chapterId,
      date: history.date,
      story: { title: history.storyTitle },
      ...(history.chapterTitle && {
        chapter: {
          title: history.chapterTitle,
          order: history.chapterOrder
        }
      })
    }));
  }

  async getHistoriesForSpecificStory(userId: string, storyId: string): Promise<SpecificReadHistoryResponseDto> {
    const query = `
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
    const result = await this.dataSource.query(query, [userId, storyId]);
    const history = result[0];
    if (history) {
      return {
        id: history.id,
        userId: history.userId,
        storyId: history.storyId,
        chapterId: history.chapterId,
        date: history.date,
        story: { title: history.storyTitle },
        chapter: { title: history.chapterTitle, order: history.chapterOrder }
      };
    }
    return null;
  }
}
