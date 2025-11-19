import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddBookmarkTable1762920000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'Bookmark',
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
      'Bookmark',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'User',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'Bookmark',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'Bookmark',
      new TableIndex({
        name: 'IDX_BOOKMARK_USERID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'Bookmark',
      new TableIndex({
        name: 'unique_user_story_bookmark',
        columnNames: ['userId', 'storyId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('Bookmark');
  }
}
