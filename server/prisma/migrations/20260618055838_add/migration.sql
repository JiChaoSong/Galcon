-- DropForeignKey
ALTER TABLE "TaskItem" DROP CONSTRAINT "TaskItem_questionId_fkey";

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
