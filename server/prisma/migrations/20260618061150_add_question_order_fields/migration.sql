-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "analysisOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "analysisPhase" TEXT,
ADD COLUMN     "globalTestOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testBatch" TEXT;
