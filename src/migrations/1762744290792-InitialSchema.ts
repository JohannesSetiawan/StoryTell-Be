import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchema1762744290792 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create User table
    await queryRunner.createTable(
      new Table({
        name: 'User',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            default: "'No description'",
          },
          {
            name: 'isAdmin',
            type: 'boolean',
            default: false,
          },
          {
            name: 'dateCreated',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    // Create Story table
    await queryRunner.createTable(
      new Table({
        name: 'Story',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            default: "'No description'",
          },
          {
            name: 'authorId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'isprivate',
            type: 'boolean',
            default: false,
          },
          {
            name: 'dateCreated',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'Story',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'Story',
      new TableIndex({
        name: 'IDX_STORY_AUTHORID',
        columnNames: ['authorId'],
      }),
    );

    // Create Chapter table
    await queryRunner.createTable(
      new Table({
        name: 'Chapter',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'storyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'order',
            type: 'integer',
            default: 1,
          },
          {
            name: 'dateCreated',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'Chapter',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'Chapter',
      new TableIndex({
        name: 'IDX_CHAPTER_STORYID',
        columnNames: ['storyId'],
      }),
    );

    // Create StoryComment table
    await queryRunner.createTable(
      new Table({
        name: 'StoryComment',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'authorId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'storyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'chapterId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'parentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'dateCreated',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'StoryComment',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'StoryComment',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'StoryComment',
      new TableForeignKey({
        columnNames: ['chapterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Chapter',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'StoryComment',
      new TableForeignKey({
        columnNames: ['parentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'StoryComment',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'StoryComment',
      new TableIndex({
        name: 'IDX_STORYCOMMENT_AUTHORID',
        columnNames: ['authorId'],
      }),
    );

    await queryRunner.createIndex(
      'StoryComment',
      new TableIndex({
        name: 'IDX_STORYCOMMENT_STORYID',
        columnNames: ['storyId'],
      }),
    );

    // Create Rating table
    await queryRunner.createTable(
      new Table({
        name: 'Rating',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'rate',
            type: 'integer',
            isNullable: false,
            default: 10,
          },
          {
            name: 'authorId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'storyId',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'Rating',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'Rating',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'Rating',
      new TableIndex({
        name: 'IDX_RATING_AUTHORID',
        columnNames: ['authorId'],
      }),
    );

    await queryRunner.createIndex(
      'Rating',
      new TableIndex({
        name: 'IDX_RATING_STORYID',
        columnNames: ['storyId'],
      }),
    );

    await queryRunner.createIndex(
      'Rating',
      new TableIndex({
        name: 'rating_storyid_authorid_unique',
        columnNames: ['storyId', 'authorId'],
        isUnique: true,
      }),
    );

    // Create ReadHistory table
    await queryRunner.createTable(
      new Table({
        name: 'ReadHistory',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'storyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'chapterId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'date',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'ReadHistory',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ReadHistory',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ReadHistory',
      new TableForeignKey({
        columnNames: ['chapterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Chapter',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'ReadHistory',
      new TableIndex({
        name: 'readhistory_storyid_userid_unique',
        columnNames: ['storyId', 'userId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ReadHistory');
    await queryRunner.dropTable('Rating');
    await queryRunner.dropTable('StoryComment');
    await queryRunner.dropTable('Chapter');
    await queryRunner.dropTable('Story');
    await queryRunner.dropTable('User');
  }
}
