-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "industry" TEXT,
    "sub_industry" TEXT,
    "target_market" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "owner_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "official_website" TEXT,
    "industry" TEXT,
    "product_category" TEXT,
    "brand_intro" TEXT,
    "target_customers" TEXT,
    "core_products" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_brands" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'target',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "target_brand_id" TEXT NOT NULL,
    "competitor_brand_id" TEXT NOT NULL,
    "competitor_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT '中',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "supports_citation" BOOLEAN NOT NULL DEFAULT false,
    "supports_web_search" BOOLEAN NOT NULL DEFAULT false,
    "test_method" TEXT NOT NULL DEFAULT '手动',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "industry" TEXT,
    "question_type" TEXT,
    "intent" TEXT,
    "is_general" BOOLEAN NOT NULL DEFAULT true,
    "difficulty" TEXT,
    "created_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_questions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "target_brand_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt_text" TEXT,
    "answer_text" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_brands_project_id_brand_id_key" ON "project_brands"("project_id", "brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_project_id_target_brand_id_competitor_brand_id_key" ON "competitors"("project_id", "target_brand_id", "competitor_brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_questions_project_id_question_id_key" ON "project_questions"("project_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_tasks_project_id_question_id_platform_id_target_brand__key" ON "test_tasks"("project_id", "question_id", "platform_id", "target_brand_id");

-- AddForeignKey
ALTER TABLE "project_brands" ADD CONSTRAINT "project_brands_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_brands" ADD CONSTRAINT "project_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_target_brand_id_fkey" FOREIGN KEY ("target_brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_competitor_brand_id_fkey" FOREIGN KEY ("competitor_brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_questions" ADD CONSTRAINT "project_questions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_questions" ADD CONSTRAINT "project_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_target_brand_id_fkey" FOREIGN KEY ("target_brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
