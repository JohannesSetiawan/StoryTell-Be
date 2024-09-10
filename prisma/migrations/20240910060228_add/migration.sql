-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_authorId_fkey";

-- DropForeignKey
ALTER TABLE "StoryComment" DROP CONSTRAINT "StoryComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "StoryComment" DROP CONSTRAINT "StoryComment_storyId_fkey";

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
