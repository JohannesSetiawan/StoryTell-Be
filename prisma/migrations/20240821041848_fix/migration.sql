/*
  Warnings:

  - Made the column `content` on table `Chapter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `order` on table `Chapter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Chapter" ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "order" SET NOT NULL;

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "description" SET DEFAULT 'No description';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL;
