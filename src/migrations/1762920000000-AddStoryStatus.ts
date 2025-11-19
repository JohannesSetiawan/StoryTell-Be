import { MigrationInterface, QueryRunner, TableColumn, TableCheck } from 'typeorm';

export class AddStoryStatus1762920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, add storyStatus column as nullable
    await queryRunner.addColumn(
      'Story',
      new TableColumn({
        name: 'storyStatus',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    // Update all existing rows to have 'Ongoing' status
    await queryRunner.query(`UPDATE "Story" SET "storyStatus" = 'Ongoing' WHERE "storyStatus" IS NULL`);

    // Now make the column NOT NULL with default value
    await queryRunner.changeColumn(
      'Story',
      'storyStatus',
      new TableColumn({
        name: 'storyStatus',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: "'Ongoing'",
      }),
    );

    // Add check constraint to ensure only valid status values
    await queryRunner.createCheckConstraint(
      'Story',
      new TableCheck({
        name: 'story_status_check',
        expression: `"storyStatus" IN ('Ongoing', 'Cancelled', 'Dropped', 'Completed')`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint('Story', 'story_status_check');
    await queryRunner.dropColumn('Story', 'storyStatus');
  }
}
