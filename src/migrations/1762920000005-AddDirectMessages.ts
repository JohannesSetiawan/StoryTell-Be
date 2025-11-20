import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDirectMessages1762920000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "Message" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "senderId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "receiverId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        "timeSent" TIMESTAMP DEFAULT NOW(),
        "isRead" BOOLEAN DEFAULT false,
        "timeRead" TIMESTAMP,
        "isDeleted" BOOLEAN DEFAULT false
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_sender_receiver ON "Message"("senderId", "receiverId");
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_receiver_unread ON "Message"("receiverId", "isRead") WHERE "isDeleted" = false;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_time_sent ON "Message"("timeSent" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_message_time_sent`);
    await queryRunner.query(`DROP INDEX idx_message_receiver_unread`);
    await queryRunner.query(`DROP INDEX idx_message_sender_receiver`);
    await queryRunner.query(`DROP TABLE "Message"`);
  }
}
