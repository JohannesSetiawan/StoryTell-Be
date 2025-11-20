import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMessageDeletionPerUser1762920000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the index first (it references isDeleted column in WHERE clause)
    await queryRunner.query(`
      DROP INDEX idx_message_receiver_unread;
    `);

    // Add new columns for per-user deletion
    await queryRunner.query(`
      ALTER TABLE "Message"
      ADD COLUMN "deletedBySender" BOOLEAN DEFAULT false,
      ADD COLUMN "deletedByReceiver" BOOLEAN DEFAULT false;
    `);

    // Migrate existing data: if isDeleted was true, mark as deleted by both
    await queryRunner.query(`
      UPDATE "Message"
      SET "deletedBySender" = true, "deletedByReceiver" = true
      WHERE "isDeleted" = true;
    `);

    // Drop the old isDeleted column
    await queryRunner.query(`
      ALTER TABLE "Message"
      DROP COLUMN "isDeleted";
    `);

    // Create the new index with updated WHERE clause
    await queryRunner.query(`
      CREATE INDEX idx_message_receiver_unread ON "Message"("receiverId", "isRead") 
      WHERE "deletedByReceiver" = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate isDeleted column
    await queryRunner.query(`
      ALTER TABLE "Message"
      ADD COLUMN "isDeleted" BOOLEAN DEFAULT false;
    `);

    // Migrate data back: if deleted by either user, mark as deleted
    await queryRunner.query(`
      UPDATE "Message"
      SET "isDeleted" = true
      WHERE "deletedBySender" = true OR "deletedByReceiver" = true;
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE "Message"
      DROP COLUMN "deletedBySender",
      DROP COLUMN "deletedByReceiver";
    `);

    // Restore old index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_message_receiver_unread;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_receiver_unread ON "Message"("receiverId", "isRead") 
      WHERE "isDeleted" = false;
    `);
  }
}
