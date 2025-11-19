import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddTagTables1762919851340 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Tag table
    await queryRunner.createTable(
      new Table({
        name: 'Tag',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
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

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'Tag',
      new TableIndex({
        name: 'IDX_TAG_NAME',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'Tag',
      new TableIndex({
        name: 'IDX_TAG_CATEGORY',
        columnNames: ['category'],
      }),
    );

    // Create TagStory junction table
    await queryRunner.createTable(
      new Table({
        name: 'TagStory',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'tagId',
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
      'TagStory',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Tag',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'TagStory',
      new TableForeignKey({
        columnNames: ['storyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'Story',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for junction table
    await queryRunner.createIndex(
      'TagStory',
      new TableIndex({
        name: 'IDX_TAGSTORY_TAGID',
        columnNames: ['tagId'],
      }),
    );

    await queryRunner.createIndex(
      'TagStory',
      new TableIndex({
        name: 'IDX_TAGSTORY_STORYID',
        columnNames: ['storyId'],
      }),
    );

    // Add unique constraint to prevent duplicate tag-story combinations
    await queryRunner.createIndex(
      'TagStory',
      new TableIndex({
        name: 'tagstory_tagid_storyid_unique',
        columnNames: ['tagId', 'storyId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('TagStory');
    await queryRunner.dropTable('Tag');
  }
}
