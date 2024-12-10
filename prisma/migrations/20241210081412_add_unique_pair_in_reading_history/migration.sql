/*
  Warnings:

  - A unique constraint covering the columns `[storyId,userId]` on the table `ReadHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReadHistory_storyId_userId_key" ON "ReadHistory"("storyId", "userId");
