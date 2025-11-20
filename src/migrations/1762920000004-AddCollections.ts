import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollections1762920000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "Collection" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        "isPublic" BOOLEAN DEFAULT false,
        "isCollaborative" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "CollectionStory" (
        "collectionId" UUID REFERENCES "Collection"(id) ON DELETE CASCADE,
        "storyId" UUID REFERENCES "Story"(id) ON DELETE CASCADE,
        "addedBy" UUID REFERENCES "User"(id),
        "addedAt" TIMESTAMP DEFAULT NOW(),
        "order" INTEGER,
        PRIMARY KEY ("collectionId", "storyId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "CollectionCollaborator" (
        "collectionId" UUID REFERENCES "Collection"(id) ON DELETE CASCADE,
        "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
        "canEdit" BOOLEAN DEFAULT false,
        "invitedAt" TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY ("collectionId", "userId")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "CollectionCollaborator"`);
    await queryRunner.query(`DROP TABLE "CollectionStory"`);
    await queryRunner.query(`DROP TABLE "Collection"`);
  }
}
