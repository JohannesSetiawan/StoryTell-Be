/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions } from 'node-pg-migrate';
import { MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Create Tag table
    pgm.createTable('Tag', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'varchar(100)', notNull: true, unique: true },
        category: { type: 'varchar(50)', notNull: true },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    
    // Create indexes for better query performance
    pgm.createIndex('Tag', 'name');
    pgm.createIndex('Tag', 'category');
    
    // Create TagStory junction table
    pgm.createTable('TagStory', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        tagId: { type: 'uuid', notNull: true, references: '"Tag"(id)', onDelete: 'CASCADE' },
        storyId: { type: 'uuid', notNull: true, references: '"Story"(id)', onDelete: 'CASCADE' },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    
    // Create indexes for junction table
    pgm.createIndex('TagStory', 'tagId');
    pgm.createIndex('TagStory', 'storyId');
    
    // Add unique constraint to prevent duplicate tag-story combinations
    pgm.addConstraint('TagStory', 'tagstory_tagid_storyid_unique', {
        unique: ['tagId', 'storyId'],
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('TagStory');
    pgm.dropTable('Tag');
}
