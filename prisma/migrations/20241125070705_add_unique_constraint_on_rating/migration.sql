/*
  Warnings:

  - A unique constraint covering the columns `[storyId,authorId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Rating_storyId_authorId_key" ON "Rating"("storyId", "authorId");
