-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "rate" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rating_authorId_idx" ON "Rating"("authorId");

-- CreateIndex
CREATE INDEX "Rating_storyId_idx" ON "Rating"("storyId");

-- CreateIndex
CREATE INDEX "Chapter_storyId_idx" ON "Chapter"("storyId");

-- CreateIndex
CREATE INDEX "Story_authorId_idx" ON "Story"("authorId");

-- CreateIndex
CREATE INDEX "StoryComment_authorId_idx" ON "StoryComment"("authorId");

-- CreateIndex
CREATE INDEX "StoryComment_storyId_idx" ON "StoryComment"("storyId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
