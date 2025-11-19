import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddPerformanceIndexes1762920000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Story indexes for filtering and authorization
    await queryRunner.createIndex(
      'Story',
      new TableIndex({
        name: 'idx_story_authorid',
        columnNames: ['authorId'],
      }),
    );

    await queryRunner.createIndex(
      'Story',
      new TableIndex({
        name: 'idx_story_isprivate',
        columnNames: ['isprivate'],
      }),
    );

    await queryRunner.createIndex(
      'Story',
      new TableIndex({
        name: 'idx_story_datecreated',
        columnNames: ['dateCreated'],
      }),
    );

    // Chapter indexes for story-chapter relationships
    await queryRunner.createIndex(
      'Chapter',
      new TableIndex({
        name: 'idx_chapter_storyid',
        columnNames: ['storyId'],
      }),
    );

    await queryRunner.createIndex(
      'Chapter',
      new TableIndex({
        name: 'idx_chapter_storyid_order',
        columnNames: ['storyId', 'order'],
      }),
    );

    // StoryComment indexes for fetching comments by story/chapter
    await queryRunner.createIndex(
      'StoryComment',
      new TableIndex({
        name: 'idx_storycomment_storyid',
        columnNames: ['storyId'],
      }),
    );

    await queryRunner.createIndex(
      'StoryComment',
      new TableIndex({
        name: 'idx_storycomment_chapterid',
        columnNames: ['chapterId'],
      }),
    );

    // ReadHistory indexes for user history tracking
    await queryRunner.createIndex(
      'ReadHistory',
      new TableIndex({
        name: 'idx_readhistory_userid',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'ReadHistory',
      new TableIndex({
        name: 'idx_readhistory_storyid',
        columnNames: ['storyId'],
      }),
    );

    await queryRunner.createIndex(
      'ReadHistory',
      new TableIndex({
        name: 'idx_readhistory_userid_storyid',
        columnNames: ['userId', 'storyId'],
      }),
    );

    // Rating composite index for user-story ratings
    await queryRunner.createIndex(
      'Rating',
      new TableIndex({
        name: 'idx_rating_storyid_authorid',
        columnNames: ['storyId', 'authorId'],
      }),
    );

    // TagStory indexes for tag-story relationships
    await queryRunner.createIndex(
      'TagStory',
      new TableIndex({
        name: 'idx_tagstory_tagid',
        columnNames: ['tagId'],
      }),
    );

    await queryRunner.createIndex(
      'TagStory',
      new TableIndex({
        name: 'idx_tagstory_storyid',
        columnNames: ['storyId'],
      }),
    );

    // Bookmark composite index for user-story bookmarks
    await queryRunner.createIndex(
      'Bookmark',
      new TableIndex({
        name: 'idx_bookmark_userid_storyid',
        columnNames: ['userId', 'storyId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.dropIndex('Bookmark', 'idx_bookmark_userid_storyid');
    await queryRunner.dropIndex('TagStory', 'idx_tagstory_storyid');
    await queryRunner.dropIndex('TagStory', 'idx_tagstory_tagid');
    await queryRunner.dropIndex('Rating', 'idx_rating_storyid_authorid');
    await queryRunner.dropIndex('ReadHistory', 'idx_readhistory_userid_storyid');
    await queryRunner.dropIndex('ReadHistory', 'idx_readhistory_storyid');
    await queryRunner.dropIndex('ReadHistory', 'idx_readhistory_userid');
    await queryRunner.dropIndex('StoryComment', 'idx_storycomment_chapterid');
    await queryRunner.dropIndex('StoryComment', 'idx_storycomment_storyid');
    await queryRunner.dropIndex('Chapter', 'idx_chapter_storyid_order');
    await queryRunner.dropIndex('Chapter', 'idx_chapter_storyid');
    await queryRunner.dropIndex('Story', 'idx_story_datecreated');
    await queryRunner.dropIndex('Story', 'idx_story_isprivate');
    await queryRunner.dropIndex('Story', 'idx_story_authorid');
  }
}
