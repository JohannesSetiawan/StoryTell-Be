import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateCollectionDto, UpdateCollectionDto, Collection } from './collection.dto';
import { PaginatedResult } from '../story/story.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CollectionService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createCollection(userId: string, data: CreateCollectionDto): Promise<Collection> {
    const { name, description, isPublic, isCollaborative } = data;
    const query = `
      INSERT INTO "Collection" ("userId", name, description, "isPublic", "isCollaborative")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [userId, name, description, isPublic || false, isCollaborative || false];
    const result = await this.dataSource.query(query, values);
    return result[0];
  }

  async getUserCollections(userId: string, page: number = 1, perPage: number = 10): Promise<PaginatedResult<Collection>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    const countQuery = `SELECT COUNT(*) FROM "Collection" WHERE "userId" = $1`;
    const totalResult = await this.dataSource.query(countQuery, [userId]);
    const total = parseInt(totalResult[0].count, 10);

    const query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM "CollectionStory" cs WHERE cs."collectionId" = c.id) as "storyCount"
      FROM "Collection" c
      WHERE c."userId" = $1
      ORDER BY c."updatedAt" DESC
      LIMIT $2 OFFSET $3
    `;
    const collections = await this.dataSource.query(query, [userId, take, skip]);

    const lastPage = Math.ceil(total / take);

    return {
      data: collections,
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

  async getCollectionById(id: string, userId?: string): Promise<Collection> {
    const query = `
      SELECT c.*, u.username as "authorUsername"
      FROM "Collection" c
      LEFT JOIN "User" u ON c."userId" = u.id
      WHERE c.id = $1
    `;
    const result = await this.dataSource.query(query, [id]);
    const collection = result[0];

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Check visibility
    if (!collection.isPublic && collection.userId !== userId) {
      // Check if collaborator
      if (userId) {
        const collaboratorQuery = `SELECT 1 FROM "CollectionCollaborator" WHERE "collectionId" = $1 AND "userId" = $2`;
        const isCollaborator = await this.dataSource.query(collaboratorQuery, [id, userId]);
        if (isCollaborator.length === 0) {
          throw new ForbiddenException('You do not have access to this collection');
        }
      } else {
        throw new ForbiddenException('You do not have access to this collection');
      }
    }

    collection.author = { username: collection.authorUsername };

    // Fetch stories
    const storiesQuery = `
      SELECT s.*, cs."addedAt", cs."order", u.username as "authorUsername"
      FROM "CollectionStory" cs
      JOIN "Story" s ON cs."storyId" = s.id
      LEFT JOIN "User" u ON s."authorId" = u.id
      WHERE cs."collectionId" = $1
      ORDER BY cs."order" ASC, cs."addedAt" DESC
    `;
    const stories = await this.dataSource.query(storiesQuery, [id]);
    collection.stories = stories.map(story => ({
      ...story,
      author: { username: story.authorUsername }
    }));

    return collection;
  }

  async updateCollection(id: string, userId: string, data: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.checkOwnership(id, userId);

    const { name, description, isPublic, isCollaborative } = data;
    const query = `
      UPDATE "Collection"
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description), 
          "isPublic" = COALESCE($3, "isPublic"), 
          "isCollaborative" = COALESCE($4, "isCollaborative"),
          "updatedAt" = NOW()
      WHERE id = $5
      RETURNING *;
    `;
    const result = await this.dataSource.query(query, [name, description, isPublic, isCollaborative, id]);
    return result[0];
  }

  async deleteCollection(id: string, userId: string): Promise<void> {
    await this.checkOwnership(id, userId);
    await this.dataSource.query(`DELETE FROM "Collection" WHERE id = $1`, [id]);
  }

  async addStoryToCollection(collectionId: string, storyId: string, userId: string): Promise<void> {
    // Check access (owner or collaborator)
    const hasAccess = await this.checkAccess(collectionId, userId, true);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to add stories to this collection');
    }

    // Check if story exists
    const storyExists = await this.dataSource.query(`SELECT 1 FROM "Story" WHERE id = $1`, [storyId]);
    if (storyExists.length === 0) {
      throw new NotFoundException('Story not found');
    }

    // Get max order
    const maxOrderResult = await this.dataSource.query(`SELECT MAX("order") as max_order FROM "CollectionStory" WHERE "collectionId" = $1`, [collectionId]);
    const nextOrder = (maxOrderResult[0].max_order || 0) + 1;

    const query = `
      INSERT INTO "CollectionStory" ("collectionId", "storyId", "addedBy", "order")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("collectionId", "storyId") DO NOTHING
    `;
    await this.dataSource.query(query, [collectionId, storyId, userId, nextOrder]);
    
    // Update collection updatedAt
    await this.dataSource.query(`UPDATE "Collection" SET "updatedAt" = NOW() WHERE id = $1`, [collectionId]);
  }

  async removeStoryFromCollection(collectionId: string, storyId: string, userId: string): Promise<void> {
    const hasAccess = await this.checkAccess(collectionId, userId, true);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to remove stories from this collection');
    }

    await this.dataSource.query(`DELETE FROM "CollectionStory" WHERE "collectionId" = $1 AND "storyId" = $2`, [collectionId, storyId]);
    
    // Update collection updatedAt
    await this.dataSource.query(`UPDATE "Collection" SET "updatedAt" = NOW() WHERE id = $1`, [collectionId]);
  }

  async getDiscoverCollections(page: number = 1, perPage: number = 10): Promise<PaginatedResult<Collection>> {
    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    const countQuery = `SELECT COUNT(*) FROM "Collection" WHERE "isPublic" = true`;
    const totalResult = await this.dataSource.query(countQuery);
    const total = parseInt(totalResult[0].count, 10);

    const query = `
      SELECT c.*, u.username as "authorUsername",
        (SELECT COUNT(*) FROM "CollectionStory" cs WHERE cs."collectionId" = c.id) as "storyCount"
      FROM "Collection" c
      LEFT JOIN "User" u ON c."userId" = u.id
      WHERE c."isPublic" = true
      ORDER BY c."updatedAt" DESC
      LIMIT $1 OFFSET $2
    `;
    const collections = await this.dataSource.query(query, [take, skip]);
    
    const mappedCollections = collections.map(c => ({
      ...c,
      author: { username: c.authorUsername }
    }));

    const lastPage = Math.ceil(total / take);

    return {
      data: mappedCollections,
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

  async getUserPublicCollections(username: string, page: number = 1, perPage: number = 10): Promise<PaginatedResult<Collection>> {
    const userResult = await this.dataSource.query('SELECT id FROM "User" WHERE username = $1', [username]);
    if (userResult.length === 0) {
      throw new NotFoundException('User not found');
    }
    const userId = userResult[0].id;

    const pageNumber = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (pageNumber - 1) * take;

    const countQuery = `SELECT COUNT(*) FROM "Collection" WHERE "userId" = $1 AND "isPublic" = true`;
    const totalResult = await this.dataSource.query(countQuery, [userId]);
    const total = parseInt(totalResult[0].count, 10);

    const query = `
      SELECT c.*, u.username as "authorUsername",
        (SELECT COUNT(*) FROM "CollectionStory" cs WHERE cs."collectionId" = c.id) as "storyCount"
      FROM "Collection" c
      LEFT JOIN "User" u ON c."userId" = u.id
      WHERE c."userId" = $1 AND c."isPublic" = true
      ORDER BY c."updatedAt" DESC
      LIMIT $2 OFFSET $3
    `;
    const collections = await this.dataSource.query(query, [userId, take, skip]);
    
    const mappedCollections = collections.map(c => ({
      ...c,
      author: { username: c.authorUsername }
    }));

    const lastPage = Math.ceil(total / take);

    return {
      data: mappedCollections,
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

  private async checkOwnership(collectionId: string, userId: string): Promise<Collection> {
    const result = await this.dataSource.query(`SELECT * FROM "Collection" WHERE id = $1`, [collectionId]);
    const collection = result[0];
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    if (collection.userId !== userId) {
      throw new ForbiddenException('You are not the owner of this collection');
    }
    return collection;
  }

  private async checkAccess(collectionId: string, userId: string, requireEdit: boolean = false): Promise<boolean> {
    const result = await this.dataSource.query(`SELECT * FROM "Collection" WHERE id = $1`, [collectionId]);
    const collection = result[0];
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId === userId) return true;

    if (collection.isCollaborative) {
      const collaborator = await this.dataSource.query(
        `SELECT * FROM "CollectionCollaborator" WHERE "collectionId" = $1 AND "userId" = $2`,
        [collectionId, userId]
      );
      if (collaborator.length > 0) {
        if (requireEdit && !collaborator[0].canEdit) return false;
        return true;
      }
    }

    return false;
  }
}
