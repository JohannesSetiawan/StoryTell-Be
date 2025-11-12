import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateTagDto, UpdateTagDto, Tag, TagFilterDto, PaginatedTagResponse } from './tag.dto';

@Injectable()
export class TagService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
  ) {}

  // Admin: Create a new tag
  async createTag(data: CreateTagDto): Promise<Tag> {
    const { name, category } = data;
    
    // Check if tag with the same name already exists
    const existingTag = await this.pool.query(
      'SELECT * FROM "Tag" WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    
    if (existingTag.rows.length > 0) {
      throw new ConflictException('A tag with this name already exists');
    }
    
    const query = `
      INSERT INTO "Tag" (name, category)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await this.pool.query(query, [name, category]);
    return result.rows[0];
  }

  // Admin: Get all tags with pagination and filtering
  async getAllTags(filters: TagFilterDto): Promise<PaginatedTagResponse> {
    const { page = 1, limit = 50, name, category } = filters;
    const offset = (page - 1) * limit;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`name ILIKE $${paramIndex}`);
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`category ILIKE $${paramIndex}`);
      params.push(`%${category}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM "Tag" ${whereClause}`;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const query = `
      SELECT * 
      FROM "Tag" 
      ${whereClause}
      ORDER BY category ASC, name ASC
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

  // Admin: Get a specific tag by ID
  async getTagById(id: string): Promise<Tag> {
    const query = 'SELECT * FROM "Tag" WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Tag not found');
    }
    
    return result.rows[0];
  }

  // Admin: Update a tag
  async updateTag(id: string, data: UpdateTagDto): Promise<Tag> {
    const existingTag = await this.getTagById(id);
    
    const { name, category } = data;
    
    // If updating name, check for conflicts
    if (name && name.toLowerCase() !== existingTag.name.toLowerCase()) {
      const duplicateTag = await this.pool.query(
        'SELECT * FROM "Tag" WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name, id]
      );
      
      if (duplicateTag.rows.length > 0) {
        throw new ConflictException('A tag with this name already exists');
      }
    }
    
    const query = `
      UPDATE "Tag"
      SET name = COALESCE($1, name), category = COALESCE($2, category)
      WHERE id = $3
      RETURNING *;
    `;
    const result = await this.pool.query(query, [name, category, id]);
    return result.rows[0];
  }

  // Admin: Delete a tag
  async deleteTag(id: string): Promise<Tag> {
    const tag = await this.getTagById(id);
    
    // Delete the tag (TagStory entries will be cascaded)
    const query = 'DELETE FROM "Tag" WHERE id = $1 RETURNING *';
    const result = await this.pool.query(query, [id]);
    
    return result.rows[0];
  }

  // User: Get tags for a specific story
  async getStoryTags(storyId: string): Promise<Tag[]> {
    const query = `
      SELECT t.* 
      FROM "Tag" t
      INNER JOIN "TagStory" ts ON t.id = ts."tagId"
      WHERE ts."storyId" = $1
      ORDER BY t.category ASC, t.name ASC
    `;
    const result = await this.pool.query(query, [storyId]);
    return result.rows;
  }

  // User: Assign tags to their story
  async assignTagsToStory(storyId: string, tagIds: string[]): Promise<void> {
    if (!tagIds || tagIds.length === 0) {
      throw new BadRequestException('At least one tag ID is required');
    }

    // Validate that all tags exist
    const tagsQuery = `SELECT id FROM "Tag" WHERE id = ANY($1)`;
    const tagsResult = await this.pool.query(tagsQuery, [tagIds]);
    
    if (tagsResult.rows.length !== tagIds.length) {
      throw new NotFoundException('One or more tags not found');
    }

    // Delete existing tags for this story
    await this.pool.query('DELETE FROM "TagStory" WHERE "storyId" = $1', [storyId]);

    // Insert new tags
    const insertPromises = tagIds.map(tagId =>
      this.pool.query(
        'INSERT INTO "TagStory" ("tagId", "storyId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [tagId, storyId]
      )
    );

    await Promise.all(insertPromises);
  }

  // User: Remove a specific tag from their story
  async removeTagFromStory(storyId: string, tagId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM "TagStory" WHERE "storyId" = $1 AND "tagId" = $2 RETURNING *',
      [storyId, tagId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Tag assignment not found for this story');
    }
  }

  // User: Remove all tags from their story
  async removeAllTagsFromStory(storyId: string): Promise<void> {
    await this.pool.query('DELETE FROM "TagStory" WHERE "storyId" = $1', [storyId]);
  }

  // Get tag categories (distinct)
  async getTagCategories(): Promise<string[]> {
    const query = 'SELECT DISTINCT category FROM "Tag" ORDER BY category ASC';
    const result = await this.pool.query(query);
    return result.rows.map(row => row.category);
  }
}
