/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions } from 'node-pg-migrate';
import { MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Story indexes for filtering and authorization
    pgm.createIndex('Story', 'authorId', { name: 'idx_story_authorid' });
    pgm.createIndex('Story', 'isprivate', { name: 'idx_story_isprivate' });
    pgm.createIndex('Story', 'dateCreated', { name: 'idx_story_datecreated' });

    // Chapter indexes for story-chapter relationships
    pgm.createIndex('Chapter', 'storyId', { name: 'idx_chapter_storyid' });
    pgm.createIndex('Chapter', ['storyId', 'order'], { name: 'idx_chapter_storyid_order' });

    // StoryComment indexes for fetching comments by story/chapter
    pgm.createIndex('StoryComment', 'storyId', { name: 'idx_storycomment_storyid' });
    pgm.createIndex('StoryComment', 'chapterId', { name: 'idx_storycomment_chapterid' });

    // ReadHistory indexes for user history tracking
    pgm.createIndex('ReadHistory', 'userId', { name: 'idx_readhistory_userid' });
    pgm.createIndex('ReadHistory', 'storyId', { name: 'idx_readhistory_storyid' });
    pgm.createIndex('ReadHistory', ['userId', 'storyId'], { name: 'idx_readhistory_userid_storyid' });

    // Rating composite index for user-story ratings
    pgm.createIndex('Rating', ['storyId', 'authorId'], { name: 'idx_rating_storyid_authorid' });

    // TagStory indexes for tag-story relationships
    pgm.createIndex('TagStory', 'tagId', { name: 'idx_tagstory_tagid' });
    pgm.createIndex('TagStory', 'storyId', { name: 'idx_tagstory_storyid' });

    // Bookmark composite index for user-story bookmarks
    pgm.createIndex('Bookmark', ['userId', 'storyId'], { name: 'idx_bookmark_userid_storyid' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    // Drop all indexes in reverse order
    pgm.dropIndex('Bookmark', ['userId', 'storyId'], { name: 'idx_bookmark_userid_storyid' });
    
    pgm.dropIndex('TagStory', 'storyId', { name: 'idx_tagstory_storyid' });
    pgm.dropIndex('TagStory', 'tagId', { name: 'idx_tagstory_tagid' });
    
    pgm.dropIndex('Rating', ['storyId', 'authorId'], { name: 'idx_rating_storyid_authorid' });
    
    pgm.dropIndex('ReadHistory', ['userId', 'storyId'], { name: 'idx_readhistory_userid_storyid' });
    pgm.dropIndex('ReadHistory', 'storyId', { name: 'idx_readhistory_storyid' });
    pgm.dropIndex('ReadHistory', 'userId', { name: 'idx_readhistory_userid' });
    
    pgm.dropIndex('StoryComment', 'chapterId', { name: 'idx_storycomment_chapterid' });
    pgm.dropIndex('StoryComment', 'storyId', { name: 'idx_storycomment_storyid' });
    
    pgm.dropIndex('Chapter', ['storyId', 'order'], { name: 'idx_chapter_storyid_order' });
    pgm.dropIndex('Chapter', 'storyId', { name: 'idx_chapter_storyid' });
    
    pgm.dropIndex('Story', 'dateCreated', { name: 'idx_story_datecreated' });
    pgm.dropIndex('Story', 'isprivate', { name: 'idx_story_isprivate' });
    pgm.dropIndex('Story', 'authorId', { name: 'idx_story_authorid' });
}
