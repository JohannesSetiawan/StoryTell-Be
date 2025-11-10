/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions } from 'node-pg-migrate';
import { MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('User', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        username: { type: 'varchar(255)', notNull: true, unique: true },
        password: { type: 'varchar(255)', notNull: true },
        description: { type: 'text', default: 'No description' },
        isAdmin: { type: 'boolean', default: false },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.createTable('Story', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        title: { type: 'varchar(255)', notNull: true },
        description: { type: 'text', default: 'No description' },
        authorId: { type: 'uuid', notNull: true, references: '"User"(id)', onDelete: 'CASCADE' },
        isprivate: { type: 'boolean', default: false },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.createIndex('Story', 'authorId');

    pgm.createTable('Chapter', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        title: { type: 'varchar(255)', notNull: true },
        content: { type: 'text', notNull: true },
        storyId: { type: 'uuid', notNull: true, references: '"Story"(id)', onDelete: 'CASCADE' },
        order: { type: 'integer', default: 1 },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.createIndex('Chapter', 'storyId');

    pgm.createTable('StoryComment', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        content: { type: 'text', notNull: true },
        authorId: { type: 'uuid', notNull: true, references: '"User"(id)', onDelete: 'CASCADE' },
        storyId: { type: 'uuid', notNull: true, references: '"Story"(id)', onDelete: 'CASCADE' },
        chapterId: { type: 'uuid', references: '"Chapter"(id)', onDelete: 'CASCADE' },
        parentId: { type: 'uuid', references: '"StoryComment"(id)', onDelete: 'CASCADE' },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.createIndex('StoryComment', 'authorId');
    pgm.createIndex('StoryComment', 'storyId');

    pgm.createTable('Rating', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        rate: { type: 'integer', notNull: true, default: 10 },
        authorId: { type: 'uuid', notNull: true, references: '"User"(id)', onDelete: 'CASCADE' },
        storyId: { type: 'uuid', notNull: true, references: '"Story"(id)', onDelete: 'CASCADE' },
    });
    pgm.createIndex('Rating', 'authorId');
    pgm.createIndex('Rating', 'storyId');
    pgm.addConstraint('Rating', 'rating_storyid_authorid_unique', {
        unique: ['storyId', 'authorId'],
    });

    pgm.createTable('ReadHistory', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        userId: { type: 'uuid', notNull: true, references: '"User"(id)', onDelete: 'CASCADE' },
        storyId: { type: 'uuid', notNull: true, references: '"Story"(id)', onDelete: 'CASCADE' },
        chapterId: { type: 'uuid', references: '"Chapter"(id)', onDelete: 'CASCADE' },
        date: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.addConstraint('ReadHistory', 'readhistory_storyid_userid_unique', {
        unique: ['storyId', 'userId'],
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('ReadHistory');
    pgm.dropTable('Rating');
    pgm.dropTable('StoryComment');
    pgm.dropTable('Chapter');
    pgm.dropTable('Story');
    pgm.dropTable('User');
}
