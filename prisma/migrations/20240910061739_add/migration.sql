-- AlterTable
ALTER TABLE "StoryComment" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StoryComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
