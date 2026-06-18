-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "subIndustry" TEXT,
    "targetMarket" TEXT,
    "status" TEXT NOT NULL DEFAULT 'preparing',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "owner" TEXT NOT NULL,
    "description" TEXT,
    "taskTotal" INTEGER NOT NULL DEFAULT 0,
    "taskDone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "category" TEXT,
    "intro" TEXT,
    "customers" TEXT,
    "products" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "industry" TEXT,
    "type" TEXT NOT NULL,
    "intent" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'basic',
    "isGeneral" BOOLEAN NOT NULL DEFAULT false,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'enabled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskBatch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "platformName" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answerText" TEXT,
    "testedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerAnalysis" (
    "id" TEXT NOT NULL,
    "taskItemId" TEXT NOT NULL,
    "mentionedBrands" JSONB NOT NULL DEFAULT '[]',
    "targetBrandMentioned" BOOLEAN NOT NULL DEFAULT false,
    "targetBrandRank" INTEGER NOT NULL DEFAULT 0,
    "targetBrandRecommended" BOOLEAN NOT NULL DEFAULT false,
    "competitorsMentioned" JSONB NOT NULL DEFAULT '[]',
    "citationSources" JSONB NOT NULL DEFAULT '[]',
    "answerSummary" TEXT,
    "accuracyStatus" TEXT NOT NULL DEFAULT 'unknown',
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "riskTypes" JSONB NOT NULL DEFAULT '[]',
    "optimizationSuggestions" TEXT,
    "manualChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brand_projectId_idx" ON "Brand"("projectId");

-- CreateIndex
CREATE INDEX "Competitor_brandId_idx" ON "Competitor"("brandId");

-- CreateIndex
CREATE INDEX "Competitor_projectId_idx" ON "Competitor"("projectId");

-- CreateIndex
CREATE INDEX "Question_projectId_idx" ON "Question"("projectId");

-- CreateIndex
CREATE INDEX "TaskBatch_projectId_idx" ON "TaskBatch"("projectId");

-- CreateIndex
CREATE INDEX "TaskItem_batchId_idx" ON "TaskItem"("batchId");

-- CreateIndex
CREATE INDEX "TaskItem_questionId_idx" ON "TaskItem"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerAnalysis_taskItemId_key" ON "AnswerAnalysis"("taskItemId");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBatch" ADD CONSTRAINT "TaskBatch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TaskBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAnalysis" ADD CONSTRAINT "AnswerAnalysis_taskItemId_fkey" FOREIGN KEY ("taskItemId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
