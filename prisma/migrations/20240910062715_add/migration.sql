-- DropForeignKey
ALTER TABLE "StoryComment" DROP CONSTRAINT "StoryComment_parentId_fkey";

-- AddForeignKey
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StoryComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
