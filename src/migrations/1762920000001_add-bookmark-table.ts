/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions } from 'node-pg-migrate';
import { MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('Bookmark', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        userId: {
            type: 'uuid',
            notNull: true,
            references: '"User"',
            onDelete: 'CASCADE',
        },
        storyId: {
            type: 'uuid',
            notNull: true,
            references: '"Story"',
            onDelete: 'CASCADE',
        },
        dateCreated: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.createIndex('Bookmark', 'userId');

    pgm.addConstraint('Bookmark', 'unique_user_story_bookmark', {
        unique: ['userId', 'storyId'],
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('Bookmark');
}
