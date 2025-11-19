import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableCheck } from 'typeorm';

export class AddFollowAndActivityFeed1762920000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Follow table
    await queryRunner.createTable(
      new Table({
        name: 'Follow',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'followerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'followingId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'followedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'Follow',
      new TableForeignKey({
        columnNames: ['followerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'Follow',
      new TableForeignKey({
        columnNames: ['followingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    // Add unique constraint to prevent duplicate follows
    await queryRunner.createIndex(
      'Follow',
      new TableIndex({
        name: 'follow_follower_following_unique',
        columnNames: ['followerId', 'followingId'],
        isUnique: true,
      }),
    );

    // Add check constraint to prevent self-follow
    await queryRunner.createCheckConstraint(
      'Follow',
      new TableCheck({
        name: 'follow_no_self_follow',
        expression: '"followerId" != "followingId"',
      }),
    );

    // Create indexes for efficient queries
    await queryRunner.createIndex(
      'Follow',
      new TableIndex({
        name: 'idx_follow_follower',
        columnNames: ['followerId'],
      }),
    );

    await queryRunner.createIndex(
      'Follow',
      new TableIndex({
        name: 'idx_follow_following',
        columnNames: ['followingId'],
      }),
    );

    // Create ActivityFeed table
    await queryRunner.createTable(
      new Table({
        name: 'ActivityFeed',
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
            name: 'activityType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Type of activity: new_story, new_chapter, status_change',
          },
          {
            name: 'storyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'chapterId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional data like old/new status, chapter title, etc.',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'ActivityFeed',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ActivityFeed',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ActivityFeed',
      new TableForeignKey({
        columnNames: ['chapterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Chapter',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for efficient feed queries (most recent activities first)
    await queryRunner.createIndex(
      'ActivityFeed',
      new TableIndex({
        name: 'idx_activity_user_date',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    // Create index for story activities
    await queryRunner.createIndex(
      'ActivityFeed',
      new TableIndex({
        name: 'idx_activity_story',
        columnNames: ['storyId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ActivityFeed');
    await queryRunner.dropTable('Follow');
  }
}
