/*
  Warnings:

  - You are about to drop the column `private` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "private",
ADD COLUMN     "isprivate" BOOLEAN NOT NULL DEFAULT false;
