/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions } from 'node-pg-migrate';
import { MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // First, add storyStatus column as nullable
    pgm.addColumn('Story', {
        storyStatus: {
            type: 'varchar(20)',
            notNull: false,
        },
    });

    // Update all existing rows to have 'Ongoing' status
    pgm.sql(`UPDATE "Story" SET "storyStatus" = 'Ongoing' WHERE "storyStatus" IS NULL`);

    // Now make the column NOT NULL with default value
    pgm.alterColumn('Story', 'storyStatus', {
        notNull: true,
        default: "'Ongoing'",
    });

    // Add check constraint to ensure only valid status values
    pgm.addConstraint('Story', 'story_status_check', {
        check: "\"storyStatus\" IN ('Ongoing', 'Cancelled', 'Dropped', 'Completed')",
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropConstraint('Story', 'story_status_check');
    pgm.dropColumn('Story', 'storyStatus');
}
