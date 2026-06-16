# GEO Workbench M1 — Foundation & Core Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the GEO Workbench Next.js app end-to-end through the M1 milestone: project / brand / competitor / platform / question management plus test-task generation and manual answer entry — a fully working, demoable vertical slice that stops just before LLM parsing (M2) and report generation (M3).

**Architecture:** Next.js 15 (App Router) monolith — React Server Components for read views, Route Handlers under `src/app/api/**` for all mutations, Prisma as the only DB access layer, PostgreSQL via Docker Compose for local dev. Business logic that has real branching (task-combination generation) lives in plain TypeScript functions under `src/lib/` so it can be unit-tested without booting Next.js; everything else (CRUD) lives directly in route handlers backed by Zod validation.

**Tech Stack:** Next.js 15 + TypeScript, Tailwind CSS + shadcn/ui, PostgreSQL 16 (Docker), Prisma ORM, Zod, Vitest, pnpm.

**Source documents:** [GEO诊断工作台_产品需求文档_PRD.md](../../../GEO诊断工作台_产品需求文档_PRD.md) (§7 data objects, §8.1–8.4 P0 modules, §11 acceptance), [GEO诊断工作台_技术方案.md](../../../GEO诊断工作台_技术方案.md) (§3.2 stack, §5.1–5.4 module design, §6 schema, §14 M1 milestone).

**Out of scope (future plans):** LLM answer parsing, metrics calculation, report generation, PDF/PPT export, auth/multi-tenant, browser extension, API/RPA auto-testing. These map to M2 (`answer_analyses` parsing + `project_metrics`) and M3 (`reports`) in the tech doc and will get their own plan documents after M1 ships and runs end-to-end.

---

## Acceptance Target (from PRD §11.1, M1 portion)

By the end of this plan, a user can, entirely through the UI:

```text
创建项目 → 添加品牌和竞品 → 导入问题 → 选择平台 → 生成测试任务 → 粘贴回答 → 标记任务完成
```

with every test task traceable to its project, question, platform, and brand (PRD §11.2 data acceptance, points 1–2).

---

## File Structure

```
geo-workbench/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                              # 项目列表页 /
    │   ├── globals.css
    │   ├── projects/
    │   │   ├── new/page.tsx                      # 新建项目
    │   │   └── [id]/
    │   │       ├── page.tsx                      # 项目总览
    │   │       ├── brands/page.tsx                # 品牌与竞品
    │   │       ├── questions/page.tsx              # 问题库
    │   │       └── tasks/page.tsx                  # 测试任务列表
    │   ├── tasks/[id]/page.tsx                    # 单条任务执行页
    │   ├── settings/platforms/page.tsx            # AI 平台配置
    │   └── api/
    │       ├── projects/route.ts                          # POST, GET
    │       ├── projects/[id]/route.ts                      # GET, PATCH, DELETE
    │       ├── projects/[id]/duplicate/route.ts             # POST
    │       ├── projects/[id]/brands/route.ts                 # POST, GET
    │       ├── projects/[id]/competitors/route.ts            # POST, GET
    │       ├── brands/route.ts                               # POST, GET
    │       ├── brands/[id]/route.ts                           # GET, PATCH
    │       ├── platforms/route.ts                             # GET, POST
    │       ├── platforms/[id]/route.ts                        # PATCH
    │       ├── questions/route.ts                             # POST, GET
    │       ├── questions/[id]/route.ts                        # PATCH
    │       ├── questions/batch-import/route.ts                # POST
    │       └── projects/[id]/tasks/
    │           ├── generate/route.ts                          # POST
    │           └── route.ts                                   # GET
    │       └── tasks/[id]/
    │           ├── route.ts                                   # GET, PATCH
    │           └── answer/route.ts                            # POST
    └── lib/
        ├── prisma.ts                              # Prisma client singleton
        ├── validation.ts                          # Zod schemas, all M1 entities
        ├── task-generation.ts                     # pure combination/dedup logic
        └── task-generation.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx` (placeholder), `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
cd "D:\aiproject\geo-workbench"
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm
```
When prompted about a non-empty directory (the two PRD/tech-doc markdown files already exist), confirm proceeding — it must not delete the existing `.md` files or `.claude/`.

Expected: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tailwind.config.ts` (or `postcss.config.mjs` if Tailwind v4 scaffolds CSS-first — keep whatever the CLI generates) are created. The two existing markdown files and `.claude/` must still be present.

- [ ] **Step 2: Verify the scaffold builds and runs**

Run: `pnpm build`
Expected: build succeeds with the default Next.js starter page.

- [ ] **Step 3: Add Vitest**

Run:
```bash
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Add to `package.json` `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest runs with zero tests**

Run: `pnpm test`
Expected: "No test files found" (exit code may be 1 — that's fine, no test files exist yet). This just confirms the runner wires up.

- [ ] **Step 5: Add shadcn/ui**

Run:
```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input label textarea select card table badge dialog form
```
Expected: `src/components/ui/*` populated, `components.json` created.

- [ ] **Step 6: Write `.gitignore` additions and `.env.example`**

Ensure `.gitignore` includes (append if the Next.js generator didn't already add them):
```
.env
.env.local
node_modules/
.next/
```

Create `.env.example`:
```
DATABASE_URL="postgresql://geo:geo_password@localhost:5432/geo_workbench?schema=public"
```

- [ ] **Step 7: Initialize git and commit the scaffold**

Run:
```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, shadcn/ui, Vitest"
```
Expected: commit succeeds; `git log --oneline` shows one commit.

---

## Task 2: PostgreSQL via Docker Compose + Prisma Connection

**Files:**
- Create: `docker-compose.yml`
- Create: `prisma/schema.prisma` (datasource + generator only, models added in Task 3)
- Modify: `.env` (local only, not committed), `package.json` (scripts)

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: geo_workbench
      POSTGRES_USER: geo
      POSTGRES_PASSWORD: geo_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Start Postgres and verify it's healthy**

Run:
```bash
docker compose up -d postgres
docker compose ps
```
Expected: `postgres` service shows state `running`/`healthy`.

- [ ] **Step 3: Create local `.env`**

Create `.env` (this file is gitignored, never commit it):
```
DATABASE_URL="postgresql://geo:geo_password@localhost:5432/geo_workbench?schema=public"
```

- [ ] **Step 4: Install Prisma and initialize**

Run:
```bash
pnpm add -D prisma
pnpm add @prisma/client
pnpm dlx prisma init --datasource-provider postgresql
```
This generates `prisma/schema.prisma` and a `.env` (merge with the one from Step 3 if it overwrote it — `DATABASE_URL` must match Step 3's value).

- [ ] **Step 5: Verify Prisma can reach the database**

Run: `pnpm dlx prisma db pull`
Expected: command succeeds and reports an empty schema (no tables yet) — this confirms the connection string and running container are correctly wired, not a real schema sync (real models come in Task 3).

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml prisma/schema.prisma .env.example package.json pnpm-lock.yaml
git commit -m "chore: add Postgres via Docker Compose and wire up Prisma"
```

---

## Task 3: Prisma Schema, Migration, and Seed Data

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `prisma.seed` config + `db:seed` script)

- [ ] **Step 1: Write the full M1 schema**

Replace the `prisma/schema.prisma` models section (keep the `datasource db` and `generator client` blocks from Task 2) with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id           String    @id @default(uuid())
  name         String
  type         String
  industry     String?
  subIndustry  String?   @map("sub_industry")
  targetMarket String?   @map("target_market")
  status       String    @default("draft")
  description  String?
  ownerId      String?   @map("owner_id")
  startDate    DateTime? @map("start_date")
  endDate      DateTime? @map("end_date")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  projectBrands ProjectBrand[]
  competitors   Competitor[]
  questions     ProjectQuestion[]
  testTasks     TestTask[]

  @@map("projects")
}

model Brand {
  id               String   @id @default(uuid())
  name             String
  officialWebsite  String?  @map("official_website")
  industry         String?
  productCategory  String?  @map("product_category")
  brandIntro       String?  @map("brand_intro")
  targetCustomers  String?  @map("target_customers")
  coreProducts     String?  @map("core_products")
  notes            String?
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  projectBrands        ProjectBrand[]
  asTargetCompetitors  Competitor[] @relation("TargetBrand")
  asCompetitorOf       Competitor[] @relation("CompetitorBrand")
  testTasks            TestTask[]

  @@map("brands")
}

model ProjectBrand {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  brandId   String   @map("brand_id")
  role      String   @default("target")
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  brand   Brand   @relation(fields: [brandId], references: [id], onDelete: Cascade)

  @@unique([projectId, brandId])
  @@map("project_brands")
}

model Competitor {
  id                 String   @id @default(uuid())
  projectId          String   @map("project_id")
  targetBrandId      String   @map("target_brand_id")
  competitorBrandId  String   @map("competitor_brand_id")
  competitorType     String   @map("competitor_type")
  priority           String   @default("中")
  notes              String?
  createdAt          DateTime @default(now()) @map("created_at")

  project         Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  targetBrand     Brand   @relation("TargetBrand", fields: [targetBrandId], references: [id], onDelete: Cascade)
  competitorBrand Brand   @relation("CompetitorBrand", fields: [competitorBrandId], references: [id], onDelete: Cascade)

  @@unique([projectId, targetBrandId, competitorBrandId])
  @@map("competitors")
}

model Platform {
  id                 String   @id @default(uuid())
  name               String   @unique
  region             String?
  supportsCitation   Boolean  @default(false) @map("supports_citation")
  supportsWebSearch  Boolean  @default(false) @map("supports_web_search")
  testMethod         String   @default("手动") @map("test_method")
  notes              String?
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  testTasks TestTask[]

  @@map("platforms")
}

model Question {
  id            String   @id @default(uuid())
  questionText  String   @map("question_text")
  industry      String?
  questionType  String?  @map("question_type")
  intent        String?
  isGeneral     Boolean  @default(true) @map("is_general")
  difficulty    String?
  createdByAi   Boolean  @default(false) @map("created_by_ai")
  status        String   @default("active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  projectQuestions ProjectQuestion[]
  testTasks        TestTask[]

  @@map("questions")
}

// Join table: which questions are in scope for a project's question bank.
// Lets a question be authored once and reused across projects (PRD §8.3 "复用历史问题").
model ProjectQuestion {
  id         String   @id @default(uuid())
  projectId  String   @map("project_id")
  questionId String   @map("question_id")
  createdAt  DateTime @default(now()) @map("created_at")

  project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([projectId, questionId])
  @@map("project_questions")
}

model TestTask {
  id            String    @id @default(uuid())
  projectId     String    @map("project_id")
  questionId    String    @map("question_id")
  platformId    String    @map("platform_id")
  targetBrandId String    @map("target_brand_id")
  status        String    @default("pending")
  promptText    String?   @map("prompt_text")
  answerText    String?   @map("answer_text")
  screenshotUrl String?   @map("screenshot_url")
  testedAt      DateTime? @map("tested_at")
  assignedTo    String?   @map("assigned_to")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  platform    Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)
  targetBrand Brand    @relation(fields: [targetBrandId], references: [id], onDelete: Cascade)

  @@unique([projectId, questionId, platformId, targetBrandId])
  @@map("test_tasks")
}
```

Note: `status` on `TestTask` uses values `pending | completed | needs_review | abnormal` at the application layer (Zod enum in Task 4) — Prisma stores it as a plain string so new statuses don't require a migration.

- [ ] **Step 2: Run the initial migration**

Run:
```bash
pnpm dlx prisma migrate dev --name init_m1_schema
```
Expected: migration file created under `prisma/migrations/`, command reports success, `prisma generate` runs automatically.

- [ ] **Step 3: Write the seed script**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const platforms = [
  { name: "DeepSeek", region: "国内", supportsCitation: false, supportsWebSearch: true, testMethod: "手动" },
  { name: "Kimi", region: "国内", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
  { name: "豆包", region: "国内", supportsCitation: false, supportsWebSearch: true, testMethod: "手动" },
  { name: "通义千问", region: "国内", supportsCitation: false, supportsWebSearch: true, testMethod: "手动" },
  { name: "ChatGPT", region: "海外", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
];

async function main() {
  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: platform,
      create: platform,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run: `pnpm add -D tsx`

- [ ] **Step 4: Run the seed and verify**

Run:
```bash
pnpm dlx prisma db seed
pnpm dlx prisma studio
```
Expected: seed reports 5 upserts; Prisma Studio (opens at `localhost:5555`) shows a `platforms` table with exactly the 5 rows above. Close Prisma Studio (Ctrl+C) once verified.

- [ ] **Step 5: Commit**

```bash
git add prisma/ package.json pnpm-lock.yaml
git commit -m "feat: add M1 Prisma schema, migration, and platform seed data"
```

---

## Task 4: Test Database, Prisma Client Singleton, and Validation Schemas

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/validation.ts`
- Create: `src/lib/test/reset-db.ts`
- Create: `.env.test`
- Modify: `vitest.config.ts`, `package.json`

- [ ] **Step 1: Create the `geo_workbench_test` database**

Run:
```bash
docker compose exec postgres psql -U geo -d geo_workbench -c "CREATE DATABASE geo_workbench_test;"
```
Expected: `CREATE DATABASE` printed.

- [ ] **Step 2: Create `.env.test` and migrate the test database**

Create `.env.test`:
```
DATABASE_URL="postgresql://geo:geo_password@localhost:5432/geo_workbench_test?schema=public"
```

Run:
```bash
DATABASE_URL="postgresql://geo:geo_password@localhost:5432/geo_workbench_test?schema=public" pnpm dlx prisma migrate deploy
```
Expected: reports all migrations applied to `geo_workbench_test`.

- [ ] **Step 3: Wire Vitest to load `.env.test` and add cross-platform env support**

Run: `pnpm add -D dotenv cross-env`

Modify `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

Create `vitest.setup.ts`:
```ts
import { config } from "dotenv";

config({ path: ".env.test" });
```

Update the `"test"` script in `package.json` so it always targets the test database regardless of what `.env` holds:
```json
"test": "cross-env NODE_ENV=test vitest run",
"test:watch": "cross-env NODE_ENV=test vitest watch"
```

- [ ] **Step 4: Create the Prisma client singleton**

Create `src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: Create the test DB reset helper**

Create `src/lib/test/reset-db.ts`:
```ts
import { prisma } from "@/lib/prisma";

// Deletes all M1 data in FK-safe order. Platforms are seed data shared
// across tests and intentionally left alone.
export async function resetDb() {
  await prisma.testTask.deleteMany();
  await prisma.projectQuestion.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.projectBrand.deleteMany();
  await prisma.question.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.project.deleteMany();
}
```

- [ ] **Step 6: Write the full M1 validation schema file**

Create `src/lib/validation.ts`:
```ts
import { z } from "zod";

export const projectTypeEnum = z.enum(["样板报告", "客户诊断", "月度复测"]);
export const projectStatusEnum = z.enum([
  "draft",
  "testing",
  "analyzing",
  "completed",
  "archived",
]);
export const targetMarketEnum = z.enum(["国内", "海外", "全球"]);

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  type: projectTypeEnum,
  industry: z.string().max(100).optional(),
  subIndustry: z.string().max(100).optional(),
  targetMarket: targetMarketEnum.optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  status: projectStatusEnum.optional(),
});

export const brandCreateSchema = z.object({
  name: z.string().min(1).max(255),
  officialWebsite: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  productCategory: z.string().max(100).optional(),
  brandIntro: z.string().optional(),
  targetCustomers: z.string().optional(),
  coreProducts: z.string().optional(),
  notes: z.string().optional(),
});

export const brandUpdateSchema = brandCreateSchema.partial();

export const projectBrandCreateSchema = z.object({
  brandId: z.string().uuid(),
  role: z.enum(["target", "reference"]).default("target"),
});

export const competitorTypeEnum = z.enum(["直接竞品", "替代方案", "国际竞品", "间接竞品"]);
export const priorityEnum = z.enum(["高", "中", "低"]);

export const competitorCreateSchema = z.object({
  targetBrandId: z.string().uuid(),
  competitorBrandId: z.string().uuid(),
  competitorType: competitorTypeEnum,
  priority: priorityEnum.default("中"),
  notes: z.string().optional(),
});

export const platformUpdateSchema = z.object({
  region: z.string().max(50).optional(),
  supportsCitation: z.boolean().optional(),
  supportsWebSearch: z.boolean().optional(),
  testMethod: z.enum(["手动", "API", "RPA", "插件"]).optional(),
  notes: z.string().optional(),
});

export const questionTypeEnum = z.enum([
  "品类推荐",
  "竞品对比",
  "场景解决",
  "采购决策",
  "替代方案",
  "品牌认知",
  "风险口碑",
]);
export const difficultyEnum = z.enum(["基础", "中等", "深度"]);
export const questionStatusEnum = z.enum(["active", "pending_review", "deprecated"]);

export const questionCreateSchema = z.object({
  questionText: z.string().min(1),
  industry: z.string().max(100).optional(),
  questionType: questionTypeEnum.optional(),
  intent: z.string().max(100).optional(),
  isGeneral: z.boolean().default(true),
  difficulty: difficultyEnum.optional(),
  projectId: z.string().uuid().optional(),
});

export const questionUpdateSchema = z.object({
  questionText: z.string().min(1).optional(),
  industry: z.string().max(100).optional(),
  questionType: questionTypeEnum.optional(),
  intent: z.string().max(100).optional(),
  isGeneral: z.boolean().optional(),
  difficulty: difficultyEnum.optional(),
  status: questionStatusEnum.optional(),
});

export const questionBatchImportSchema = z.object({
  projectId: z.string().uuid(),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1),
        industry: z.string().max(100).optional(),
        questionType: questionTypeEnum.optional(),
        intent: z.string().max(100).optional(),
        difficulty: difficultyEnum.optional(),
      }),
    )
    .min(1),
});

export const taskGenerateSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1),
  platformIds: z.array(z.string().uuid()).min(1),
  brandIds: z.array(z.string().uuid()).min(1),
});

export const taskStatusEnum = z.enum(["pending", "completed", "needs_review", "abnormal"]);

export const taskUpdateSchema = z.object({
  status: taskStatusEnum.optional(),
  assignedTo: z.string().optional(),
  screenshotUrl: z.string().max(500).optional(),
});

export const taskAnswerSchema = z.object({
  answerText: z.string().min(1),
  screenshotUrl: z.string().max(500).optional(),
});
```

- [ ] **Step 7: Verify everything compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/prisma.ts src/lib/validation.ts src/lib/test/reset-db.ts vitest.config.ts vitest.setup.ts package.json pnpm-lock.yaml .gitignore
git commit -m "chore: add test database, Prisma singleton, and Zod validation schemas"
```

Note: `.env.test` is local config (mirrors `.env`'s gitignore treatment) — do not commit it; commit a `.env.test.example` instead if you want it tracked. For this plan it's fine to leave untracked since `.env.example` already documents the shape.

---

## Task 5: Projects API (CRUD + Duplicate)

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/duplicate/route.ts`
- Test: `src/app/api/projects/route.test.ts`
- Test: `src/app/api/projects/[id]/route.test.ts`
- Test: `src/app/api/projects/[id]/duplicate/route.test.ts`

- [ ] **Step 1: Write the failing test for create + list**

Create `src/app/api/projects/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/projects", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a project and returns 201", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "CRM 行业样板报告", type: "样板报告", industry: "B2B SaaS" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("CRM 行业样板报告");
    expect(body.status).toBe("draft");
  });

  it("rejects an invalid project type", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Bad project", type: "不存在的类型" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("lists projects ordered by most recently updated", async () => {
    await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Project A", type: "样板报告" }),
      }),
    );
    await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Project B", type: "客户诊断" }),
      }),
    );

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("Project B");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/app/api/projects/route.test.ts`
Expected: FAIL — `./route` has no exported `GET`/`POST` (module doesn't exist yet).

- [ ] **Step 3: Implement the route**

Create `src/app/api/projects/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectCreateSchema } from "@/lib/validation";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { projectBrands: true, questions: true, testTasks: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = projectCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({ data: parsed.data });
  return NextResponse.json(project, { status: 201 });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/app/api/projects/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for get/update/delete by id**

Create `src/app/api/projects/[id]/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { DELETE, GET, PATCH } from "./route";

describe("/api/projects/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns a project with aggregate counts", async () => {
    const project = await prisma.project.create({
      data: { name: "Test Project", type: "样板报告" },
    });

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: project.id }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(project.id);
    expect(body._count.projectBrands).toBe(0);
  });

  it("returns 404 for an unknown project", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });

  it("updates project fields", async () => {
    const project = await prisma.project.create({
      data: { name: "Test Project", type: "样板报告" },
    });

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "testing" }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("testing");
  });

  it("archives a project instead of hard-deleting it", async () => {
    const project = await prisma.project.create({
      data: { name: "Test Project", type: "样板报告" },
    });

    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: project.id }),
    });
    expect(res.status).toBe(200);

    const stillExists = await prisma.project.findUnique({ where: { id: project.id } });
    expect(stillExists?.status).toBe("archived");
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test "src/app/api/projects/[id]/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the route**

Create `src/app/api/projects/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { projectBrands: true, questions: true, testTasks: true } },
      testTasks: { select: { status: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = projectUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

// Archives rather than hard-deletes: diagnostic data must stay traceable
// (tech doc §13.3 可追溯) even after a project is taken off the active list.
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = await prisma.project
    .update({ where: { id }, data: { status: "archived" } })
    .catch(() => null);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test "src/app/api/projects/[id]/route.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 9: Write the failing test for duplicate**

Create `src/app/api/projects/[id]/duplicate/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/projects/:id/duplicate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("copies project info, brands, and questions into a new draft project", async () => {
    const project = await prisma.project.create({
      data: { name: "Original", type: "样板报告", industry: "B2B SaaS", status: "completed" },
    });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    await prisma.projectBrand.create({ data: { projectId: project.id, brandId: brand.id } });
    const question = await prisma.question.create({ data: { questionText: "推荐几个 CRM？" } });
    await prisma.projectQuestion.create({ data: { projectId: project.id, questionId: question.id } });

    const res = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: project.id }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.status).toBe("draft");
    expect(body.name).toContain("Original");

    const copiedBrands = await prisma.projectBrand.findMany({ where: { projectId: body.id } });
    const copiedQuestions = await prisma.projectQuestion.findMany({ where: { projectId: body.id } });
    expect(copiedBrands).toHaveLength(1);
    expect(copiedQuestions).toHaveLength(1);
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `pnpm test "src/app/api/projects/[id]/duplicate/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 11: Implement the route**

Create `src/app/api/projects/[id]/duplicate/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const { id } = await params;

  const source = await prisma.project.findUnique({
    where: { id },
    include: { projectBrands: true, competitors: true, questions: true },
  });

  if (!source) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const duplicate = await prisma.$transaction(async (tx) => {
    const newProject = await tx.project.create({
      data: {
        name: `${source.name} (副本)`,
        type: source.type,
        industry: source.industry,
        subIndustry: source.subIndustry,
        targetMarket: source.targetMarket,
        description: source.description,
        status: "draft",
      },
    });

    if (source.projectBrands.length > 0) {
      await tx.projectBrand.createMany({
        data: source.projectBrands.map((pb) => ({
          projectId: newProject.id,
          brandId: pb.brandId,
          role: pb.role,
        })),
      });
    }

    if (source.competitors.length > 0) {
      await tx.competitor.createMany({
        data: source.competitors.map((c) => ({
          projectId: newProject.id,
          targetBrandId: c.targetBrandId,
          competitorBrandId: c.competitorBrandId,
          competitorType: c.competitorType,
          priority: c.priority,
          notes: c.notes,
        })),
      });
    }

    if (source.questions.length > 0) {
      await tx.projectQuestion.createMany({
        data: source.questions.map((pq) => ({
          projectId: newProject.id,
          questionId: pq.questionId,
        })),
      });
    }

    return newProject;
  });

  return NextResponse.json(duplicate, { status: 201 });
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm test "src/app/api/projects/[id]/duplicate/route.test.ts"`
Expected: PASS (1 test).

- [ ] **Step 13: Run the full test suite and commit**

Run: `pnpm test`
Expected: all project route tests pass.

```bash
git add src/app/api/projects
git commit -m "feat: add projects API (CRUD + duplicate)"
```

---

## Task 6: Brands API (CRUD + Project Binding)

**Files:**
- Create: `src/app/api/brands/route.ts`
- Create: `src/app/api/brands/[id]/route.ts`
- Create: `src/app/api/projects/[id]/brands/route.ts`
- Test: `src/app/api/brands/route.test.ts`
- Test: `src/app/api/brands/[id]/route.test.ts`
- Test: `src/app/api/projects/[id]/brands/route.test.ts`

- [ ] **Step 1: Write the failing test for create + search list**

Create `src/app/api/brands/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/brands", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a brand", async () => {
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "纷享销客", officialWebsite: "fxiaoke.com", industry: "B2B SaaS" }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("纷享销客");
  });

  it("searches brands by name for reuse across projects", async () => {
    await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ name: "纷享销客" }) }));
    await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ name: "销售易" }) }));

    const res = await GET(new Request("http://localhost/api/brands?q=纷享"));
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("纷享销客");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/app/api/brands/route.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/brands/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCreateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const brands = await prisma.brand.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(brands);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = brandCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const brand = await prisma.brand.create({ data: parsed.data });
  return NextResponse.json(brand, { status: 201 });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/app/api/brands/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for get/update by id**

Create `src/app/api/brands/[id]/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, PATCH } from "./route";

describe("/api/brands/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns a brand by id", async () => {
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });

    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: brand.id }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("纷享销客");
  });

  it("updates brand fields", async () => {
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ industry: "CRM" }) }),
      { params: Promise.resolve({ id: brand.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.industry).toBe("CRM");
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test "src/app/api/brands/[id]/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the route**

Create `src/app/api/brands/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({ where: { id } });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json(brand);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = brandUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const brand = await prisma.brand.update({ where: { id }, data: parsed.data }).catch(() => null);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json(brand);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test "src/app/api/brands/[id]/route.test.ts"`
Expected: PASS (2 tests).

- [ ] **Step 9: Write the failing test for binding a brand to a project**

Create `src/app/api/projects/[id]/brands/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/projects/:id/brands", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("binds an existing brand to a project", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });

    const res = await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ brandId: brand.id }) }),
      { params: Promise.resolve({ id: project.id }) },
    );

    expect(res.status).toBe(201);
    const links = await prisma.projectBrand.findMany({ where: { projectId: project.id } });
    expect(links).toHaveLength(1);
  });

  it("creates a new brand and binds it in one call when no brandId is given", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ name: "销售易" }) }),
      { params: Promise.resolve({ id: project.id }) },
    );

    expect(res.status).toBe(201);
    const brand = await prisma.brand.findFirst({ where: { name: "销售易" } });
    expect(brand).not.toBeNull();
  });

  it("lists brands bound to a project with their role", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    await prisma.projectBrand.create({ data: { projectId: project.id, brandId: brand.id } });

    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: project.id }) });
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].brand.name).toBe("纷享销客");
    expect(body[0].role).toBe("target");
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `pnpm test "src/app/api/projects/[id]/brands/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 11: Implement the route**

Create `src/app/api/projects/[id]/brands/route.ts`:
```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { brandCreateSchema, projectBrandCreateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const links = await prisma.projectBrand.findMany({
    where: { projectId: id },
    include: { brand: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(links);
}

// Accepts either { brandId, role? } to bind an existing (reused) brand, or
// full brand fields to create a brand and bind it in the same request —
// the brands page offers both "search existing" and "create new" in one form.
export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const json = await req.json();

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let brandId: string;
  let role: string;

  if (typeof json.brandId === "string") {
    const parsed = projectBrandCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    brandId = parsed.data.brandId;
    role = parsed.data.role;
  } else {
    const parsed = brandCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const brand = await prisma.brand.create({ data: parsed.data });
    brandId = brand.id;
    role = "target";
  }

  try {
    const link = await prisma.projectBrand.create({
      data: { projectId, brandId, role },
      include: { brand: true },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "This brand is already bound to the project" }, { status: 409 });
    }
    throw err;
  }
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm test "src/app/api/projects/[id]/brands/route.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 13: Commit**

```bash
git add src/app/api/brands src/app/api/projects/[id]/brands
git commit -m "feat: add brands API with project binding and reuse search"
```

---

## Task 7: Competitors API

**Files:**
- Create: `src/app/api/projects/[id]/competitors/route.ts`
- Test: `src/app/api/projects/[id]/competitors/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/projects/[id]/competitors/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/projects/:id/competitors", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a competitor relationship", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const target = await prisma.brand.create({ data: { name: "纷享销客" } });
    const competitor = await prisma.brand.create({ data: { name: "销售易" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          targetBrandId: target.id,
          competitorBrandId: competitor.id,
          competitorType: "直接竞品",
          priority: "高",
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );

    expect(res.status).toBe(201);
  });

  it("rejects duplicate competitor relationships for the same project", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const target = await prisma.brand.create({ data: { name: "纷享销客" } });
    const competitor = await prisma.brand.create({ data: { name: "销售易" } });
    await prisma.competitor.create({
      data: {
        projectId: project.id,
        targetBrandId: target.id,
        competitorBrandId: competitor.id,
        competitorType: "直接竞品",
      },
    });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          targetBrandId: target.id,
          competitorBrandId: competitor.id,
          competitorType: "替代方案",
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );

    expect(res.status).toBe(409);
  });

  it("lists competitors for a project with brand names", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const target = await prisma.brand.create({ data: { name: "纷享销客" } });
    const competitor = await prisma.brand.create({ data: { name: "销售易" } });
    await prisma.competitor.create({
      data: {
        projectId: project.id,
        targetBrandId: target.id,
        competitorBrandId: competitor.id,
        competitorType: "直接竞品",
      },
    });

    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: project.id }) });
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].competitorBrand.name).toBe("销售易");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test "src/app/api/projects/[id]/competitors/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/projects/[id]/competitors/route.ts`:
```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { competitorCreateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const competitors = await prisma.competitor.findMany({
    where: { projectId: id },
    include: { targetBrand: true, competitorBrand: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(competitors);
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const json = await req.json();
  const parsed = competitorCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const competitor = await prisma.competitor.create({
      data: { projectId, ...parsed.data },
      include: { targetBrand: true, competitorBrand: true },
    });
    return NextResponse.json(competitor, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "This competitor relationship already exists for the project" },
        { status: 409 },
      );
    }
    throw err;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test "src/app/api/projects/[id]/competitors/route.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/[id]/competitors
git commit -m "feat: add competitors API with duplicate-relationship guard"
```

---

## Task 8: Platforms API

**Files:**
- Create: `src/app/api/platforms/route.ts`
- Create: `src/app/api/platforms/[id]/route.ts`
- Test: `src/app/api/platforms/route.test.ts`
- Test: `src/app/api/platforms/[id]/route.test.ts`

- [ ] **Step 1: Write the failing test for listing platforms**

Create `src/app/api/platforms/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

describe("/api/platforms", () => {
  beforeEach(async () => {
    await prisma.platform.deleteMany();
    await prisma.platform.createMany({
      data: [
        { name: "DeepSeek", region: "国内" },
        { name: "ChatGPT", region: "海外" },
      ],
    });
  });

  it("lists all platforms", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/app/api/platforms/route.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/platforms/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(platforms);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/app/api/platforms/route.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Write the failing test for editing a platform**

Create `src/app/api/platforms/[id]/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

describe("/api/platforms/:id", () => {
  beforeEach(async () => {
    await prisma.platform.deleteMany();
  });

  it("updates platform configuration", async () => {
    const platform = await prisma.platform.create({ data: { name: "DeepSeek", region: "国内" } });

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ supportsWebSearch: true, notes: "已开启联网" }),
      }),
      { params: Promise.resolve({ id: platform.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.supportsWebSearch).toBe(true);
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test "src/app/api/platforms/[id]/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the route**

Create `src/app/api/platforms/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { platformUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = platformUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const platform = await prisma.platform
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);

  if (!platform) {
    return NextResponse.json({ error: "Platform not found" }, { status: 404 });
  }

  return NextResponse.json(platform);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test "src/app/api/platforms/[id]/route.test.ts"`
Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git add src/app/api/platforms
git commit -m "feat: add platforms API (list + config update)"
```

---

## Task 9: Questions API (CRUD + Batch Import with Dedup)

**Files:**
- Create: `src/app/api/questions/route.ts`
- Create: `src/app/api/questions/[id]/route.ts`
- Create: `src/app/api/questions/batch-import/route.ts`
- Test: `src/app/api/questions/route.test.ts`
- Test: `src/app/api/questions/[id]/route.test.ts`
- Test: `src/app/api/questions/batch-import/route.test.ts`

- [ ] **Step 1: Write the failing test for create + list**

Create `src/app/api/questions/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/questions", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a standalone question", async () => {
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ questionText: "CRM 行业有哪些推荐？", questionType: "品类推荐" }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.status).toBe("active");
  });

  it("creates a question and binds it to a project when projectId is given", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ questionText: "CRM 行业有哪些推荐？", projectId: project.id }),
      }),
    );
    const body = await res.json();

    const link = await prisma.projectQuestion.findFirst({ where: { projectId: project.id, questionId: body.id } });
    expect(link).not.toBeNull();
  });

  it("filters questions by projectId", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const inProject = await prisma.question.create({ data: { questionText: "In project" } });
    await prisma.question.create({ data: { questionText: "Not in project" } });
    await prisma.projectQuestion.create({ data: { projectId: project.id, questionId: inProject.id } });

    const res = await GET(new Request(`http://localhost/api/questions?projectId=${project.id}`));
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].questionText).toBe("In project");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/app/api/questions/route.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/questions/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionCreateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q");
  const industry = searchParams.get("industry");

  const questions = await prisma.question.findMany({
    where: {
      ...(projectId ? { projectQuestions: { some: { projectId } } } : {}),
      ...(q ? { questionText: { contains: q, mode: "insensitive" } } : {}),
      ...(industry ? { industry } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = questionCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, ...data } = parsed.data;
  const question = await prisma.question.create({ data });

  if (projectId) {
    await prisma.projectQuestion.create({ data: { projectId, questionId: question.id } });
  }

  return NextResponse.json(question, { status: 201 });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/app/api/questions/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for editing a question**

Create `src/app/api/questions/[id]/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { PATCH } from "./route";

describe("/api/questions/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("updates question text and status", async () => {
    const question = await prisma.question.create({ data: { questionText: "Old text" } });

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ questionText: "New text", status: "deprecated" }),
      }),
      { params: Promise.resolve({ id: question.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.questionText).toBe("New text");
    expect(body.status).toBe("deprecated");
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test "src/app/api/questions/[id]/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the route**

Create `src/app/api/questions/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = questionUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const question = await prisma.question
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(question);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test "src/app/api/questions/[id]/route.test.ts"`
Expected: PASS (1 test).

- [ ] **Step 9: Write the failing test for batch import with dedup**

Create `src/app/api/questions/batch-import/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/questions/batch-import", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("imports questions and binds them to the project", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          questions: [{ questionText: "问题一" }, { questionText: "问题二" }],
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toHaveLength(2);
    const links = await prisma.projectQuestion.findMany({ where: { projectId: project.id } });
    expect(links).toHaveLength(2);
  });

  it("dedupes identical question text within the same batch", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          questions: [{ questionText: "重复问题" }, { questionText: "重复问题" }],
        }),
      }),
    );
    const body = await res.json();

    expect(body).toHaveLength(1);
  });

  it("reuses an existing question instead of creating a duplicate row", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const existing = await prisma.question.create({ data: { questionText: "已存在的问题" } });

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, questions: [{ questionText: "已存在的问题" }] }),
      }),
    );

    const allMatching = await prisma.question.findMany({ where: { questionText: "已存在的问题" } });
    expect(allMatching).toHaveLength(1);
    expect(allMatching[0].id).toBe(existing.id);
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `pnpm test src/app/api/questions/batch-import/route.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 11: Implement the route**

Create `src/app/api/questions/batch-import/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionBatchImportSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = questionBatchImportSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, questions } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const seen = new Set<string>();
  const uniqueInputs = questions.filter((q) => {
    const key = q.questionText.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const resultQuestions = [];
  for (const input of uniqueInputs) {
    const text = input.questionText.trim();
    const existing = await prisma.question.findFirst({
      where: { questionText: { equals: text, mode: "insensitive" } },
    });
    const question = existing ?? (await prisma.question.create({ data: { ...input, questionText: text } }));

    await prisma.projectQuestion.upsert({
      where: { projectId_questionId: { projectId, questionId: question.id } },
      update: {},
      create: { projectId, questionId: question.id },
    });

    resultQuestions.push(question);
  }

  return NextResponse.json(resultQuestions, { status: 201 });
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm test src/app/api/questions/batch-import/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 13: Commit**

```bash
git add src/app/api/questions
git commit -m "feat: add questions API with batch import and text dedup"
```

---

## Task 10: Task Generation Logic + Test Tasks API

**Files:**
- Create: `src/lib/task-generation.ts`
- Test: `src/lib/task-generation.test.ts`
- Create: `src/app/api/projects/[id]/tasks/generate/route.ts`
- Create: `src/app/api/projects/[id]/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/route.ts`
- Create: `src/app/api/tasks/[id]/answer/route.ts`
- Test: `src/app/api/projects/[id]/tasks/generate/route.test.ts`
- Test: `src/app/api/projects/[id]/tasks/route.test.ts`
- Test: `src/app/api/tasks/[id]/route.test.ts`
- Test: `src/app/api/tasks/[id]/answer/route.test.ts`

- [ ] **Step 1: Write the failing test for the combination logic**

Create `src/lib/task-generation.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildTaskCombinations } from "./task-generation";

describe("buildTaskCombinations", () => {
  it("produces the cartesian product of questions x platforms x brands", () => {
    const result = buildTaskCombinations(["q1", "q2"], ["p1", "p2", "p3"], ["b1"]);
    expect(result).toHaveLength(6);
  });

  it("excludes combinations that already exist", () => {
    const result = buildTaskCombinations(
      ["q1", "q2"],
      ["p1"],
      ["b1"],
      [{ questionId: "q1", platformId: "p1", brandId: "b1" }],
    );
    expect(result).toEqual([{ questionId: "q2", platformId: "p1", brandId: "b1" }]);
  });

  it("returns an empty array when any dimension is empty", () => {
    expect(buildTaskCombinations([], ["p1"], ["b1"])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/task-generation.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the logic**

Create `src/lib/task-generation.ts`:
```ts
export interface TaskCombination {
  questionId: string;
  platformId: string;
  brandId: string;
}

function combinationKey(c: TaskCombination): string {
  return `${c.questionId}::${c.platformId}::${c.brandId}`;
}

// Cartesian product of questions x platforms x brands, minus combinations
// that already exist as test tasks — regenerating must be idempotent
// (PRD §5.4 task generation: question_count x platform_count x brand_count = task_count).
export function buildTaskCombinations(
  questionIds: string[],
  platformIds: string[],
  brandIds: string[],
  existing: TaskCombination[] = [],
): TaskCombination[] {
  const existingKeys = new Set(existing.map(combinationKey));
  const combinations: TaskCombination[] = [];

  for (const questionId of questionIds) {
    for (const platformId of platformIds) {
      for (const brandId of brandIds) {
        const combo = { questionId, platformId, brandId };
        if (!existingKeys.has(combinationKey(combo))) {
          combinations.push(combo);
        }
      }
    }
  }

  return combinations;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/task-generation.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for the generate-tasks route**

Create `src/app/api/projects/[id]/tasks/generate/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/projects/:id/tasks/generate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function setupProject() {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const q1 = await prisma.question.create({ data: { questionText: "问题一" } });
    const q2 = await prisma.question.create({ data: { questionText: "问题二" } });
    const platforms = await prisma.platform.findMany();
    return { project, brand, questions: [q1, q2], platforms: platforms.slice(0, 2) };
  }

  it("generates question x platform x brand tasks with prompt text filled in", async () => {
    const { project, brand, questions, platforms } = await setupProject();

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          questionIds: questions.map((q) => q.id),
          platformIds: platforms.map((p) => p.id),
          brandIds: [brand.id],
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.createdCount).toBe(4);

    const tasks = await prisma.testTask.findMany({ where: { projectId: project.id } });
    expect(tasks).toHaveLength(4);
    expect(tasks[0].promptText).toBe(tasks[0].questionId === questions[0].id ? "问题一" : "问题二");
  });

  it("does not duplicate tasks when called again with the same inputs", async () => {
    const { project, brand, questions, platforms } = await setupProject();
    const payload = JSON.stringify({
      questionIds: questions.map((q) => q.id),
      platformIds: platforms.map((p) => p.id),
      brandIds: [brand.id],
    });

    await POST(new Request("http://localhost", { method: "POST", body: payload }), {
      params: Promise.resolve({ id: project.id }),
    });
    const second = await POST(new Request("http://localhost", { method: "POST", body: payload }), {
      params: Promise.resolve({ id: project.id }),
    });
    const secondBody = await second.json();

    expect(secondBody.createdCount).toBe(0);
    const tasks = await prisma.testTask.findMany({ where: { projectId: project.id } });
    expect(tasks).toHaveLength(4);
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test "src/app/api/projects/[id]/tasks/generate/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the route**

Create `src/app/api/projects/[id]/tasks/generate/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTaskCombinations } from "@/lib/task-generation";
import { taskGenerateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const json = await req.json();
  const parsed = taskGenerateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { questionIds, platformIds, brandIds } = parsed.data;

  const [questions, existingTasks] = await Promise.all([
    prisma.question.findMany({ where: { id: { in: questionIds } } }),
    prisma.testTask.findMany({
      where: { projectId, questionId: { in: questionIds } },
      select: { questionId: true, platformId: true, targetBrandId: true },
    }),
  ]);
  const questionTextById = new Map(questions.map((q) => [q.id, q.questionText]));

  const combinations = buildTaskCombinations(
    questionIds,
    platformIds,
    brandIds,
    existingTasks.map((t) => ({
      questionId: t.questionId,
      platformId: t.platformId,
      brandId: t.targetBrandId,
    })),
  );

  if (combinations.length > 0) {
    await prisma.testTask.createMany({
      data: combinations.map((c) => ({
        projectId,
        questionId: c.questionId,
        platformId: c.platformId,
        targetBrandId: c.brandId,
        promptText: questionTextById.get(c.questionId) ?? "",
      })),
    });
  }

  return NextResponse.json({ createdCount: combinations.length }, { status: 201 });
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test "src/app/api/projects/[id]/tasks/generate/route.test.ts"`
Expected: PASS (2 tests).

- [ ] **Step 9: Write the failing test for listing tasks with pagination and filters**

Create `src/app/api/projects/[id]/tasks/route.test.ts`. Each row must use a distinct platform — the same `(projectId, questionId, platformId, targetBrandId)` combination is blocked by the unique constraint from Task 3, so three rows sharing one question and brand need three different platforms:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET } from "./route";

describe("/api/projects/:id/tasks", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("paginates and filters tasks by status", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const question = await prisma.question.create({ data: { questionText: "问题一" } });
    const platforms = await prisma.platform.findMany({ take: 3 });

    await Promise.all(
      platforms.map((platform, i) =>
        prisma.testTask.create({
          data: {
            projectId: project.id,
            questionId: question.id,
            platformId: platform.id,
            targetBrandId: brand.id,
            status: i === 0 ? "completed" : "pending",
            promptText: `task ${i}`,
          },
        }),
      ),
    );

    const filtered = await GET(new Request(`http://localhost/api/x?status=completed`), {
      params: Promise.resolve({ id: project.id }),
    });
    const filteredBody = await filtered.json();
    expect(filteredBody.items).toHaveLength(1);
    expect(filteredBody.total).toBe(1);

    const paged = await GET(new Request(`http://localhost/api/x?pageSize=2&page=1`), {
      params: Promise.resolve({ id: project.id }),
    });
    const pagedBody = await paged.json();
    expect(pagedBody.items).toHaveLength(2);
    expect(pagedBody.total).toBe(3);
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `pnpm test "src/app/api/projects/[id]/tasks/route.test.ts"`
Expected: FAIL — module does not exist.

- [ ] **Step 11: Implement the route**

Create `src/app/api/projects/[id]/tasks/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const platformId = searchParams.get("platformId");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));

  const where = {
    projectId,
    ...(status ? { status } : {}),
    ...(platformId ? { platformId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.testTask.findMany({
      where,
      include: { question: true, platform: true, targetBrand: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.testTask.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm test "src/app/api/projects/[id]/tasks/route.test.ts"`
Expected: PASS (1 test).

- [ ] **Step 13: Write the failing test for updating a task and saving an answer**

Create `src/app/api/tasks/[id]/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, PATCH } from "./route";

describe("/api/tasks/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function createTask() {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const question = await prisma.question.create({ data: { questionText: "问题一" } });
    const [platform] = await prisma.platform.findMany({ take: 1 });
    return prisma.testTask.create({
      data: { projectId: project.id, questionId: question.id, platformId: platform.id, targetBrandId: brand.id },
    });
  }

  it("returns task detail with related question/platform/brand", async () => {
    const task = await createTask();

    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: task.id }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.question.questionText).toBe("问题一");
  });

  it("marks a task as abnormal", async () => {
    const task = await createTask();

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "abnormal" }) }),
      { params: Promise.resolve({ id: task.id }) },
    );
    const body = await res.json();

    expect(body.status).toBe("abnormal");
  });
});
```

Create `src/app/api/tasks/[id]/answer/route.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/tasks/:id/answer", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("saves the pasted answer and marks the task completed", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const question = await prisma.question.create({ data: { questionText: "问题一" } });
    const [platform] = await prisma.platform.findMany({ take: 1 });
    const task = await prisma.testTask.create({
      data: { projectId: project.id, questionId: question.id, platformId: platform.id, targetBrandId: brand.id },
    });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ answerText: "纷享销客是国内领先的 CRM 厂商。" }),
      }),
      { params: Promise.resolve({ id: task.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("completed");
    expect(body.answerText).toContain("纷享销客");
    expect(body.testedAt).not.toBeNull();
  });
});
```

- [ ] **Step 14: Run both tests to verify they fail**

Run:
```bash
pnpm test "src/app/api/tasks/[id]/route.test.ts" "src/app/api/tasks/[id]/answer/route.test.ts"
```
Expected: FAIL — modules do not exist.

- [ ] **Step 15: Implement both routes**

Create `src/app/api/tasks/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const task = await prisma.testTask.findUnique({
    where: { id },
    include: { question: true, platform: true, targetBrand: true, project: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = taskUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.testTask.update({ where: { id }, data: parsed.data }).catch(() => null);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}
```

Create `src/app/api/tasks/[id]/answer/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskAnswerSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

// Pasting the answer is the completion signal in this manual workflow
// (PRD §6 core flow: 粘贴 AI 回答 -> 系统自动解析); LLM parsing itself is M2.
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = taskAnswerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.testTask
    .update({
      where: { id },
      data: {
        answerText: parsed.data.answerText,
        screenshotUrl: parsed.data.screenshotUrl,
        status: "completed",
        testedAt: new Date(),
      },
    })
    .catch(() => null);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}
```

- [ ] **Step 16: Run both tests to verify they pass**

Run:
```bash
pnpm test "src/app/api/tasks/[id]/route.test.ts" "src/app/api/tasks/[id]/answer/route.test.ts"
```
Expected: PASS (3 tests total).

- [ ] **Step 17: Run the entire test suite and commit**

Run: `pnpm test`
Expected: every test file across Tasks 4-10 passes.

```bash
git add src/lib/task-generation.ts src/lib/task-generation.test.ts src/app/api/projects/[id]/tasks src/app/api/tasks
git commit -m "feat: add task generation logic and test tasks API"
```

---

## Task 11: Root Layout, Project List Page, New Project Page

**Architecture note for all remaining frontend tasks:** Pages are React Server Components that read data directly via `prisma` (no extra HTTP hop to call our own API from the server). Interactive pieces (forms, buttons that mutate data) are small `"use client"` components that call the `/api/...` routes built in Tasks 5-10 via `fetch`, then call `router.refresh()` so the parent Server Component re-fetches fresh data. This is the standard Next.js App Router data pattern and is why the API routes remain independently meaningful and tested even though pages don't fetch through them.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/projects/new/page.tsx`

- [ ] **Step 1: Replace the root layout with a minimal top nav**

Replace the full contents of `src/app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO 诊断工作台",
  description: "内部 GEO 诊断流水线工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-8 py-4 text-sm">
            <Link href="/" className="font-semibold">
              GEO Workbench
            </Link>
            <Link href="/settings/platforms" className="text-gray-500 hover:text-black">
              平台配置
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace the home page with the project list**

Replace the full contents of `src/app/page.tsx` with:
```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProjectListPage() {
  const [projects, taskCounts] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { projectBrands: true, testTasks: true } } },
    }),
    prisma.testTask.groupBy({ by: ["projectId", "status"], _count: true }),
  ]);

  const completedByProject = new Map<string, number>();
  for (const row of taskCounts) {
    if (row.status === "completed") {
      completedByProject.set(row.projectId, row._count);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">GEO 诊断项目</h1>
        <Link href="/projects/new" className="rounded bg-black px-4 py-2 text-sm text-white">
          新建项目
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">项目名称</th>
            <th>行业</th>
            <th>类型</th>
            <th>状态</th>
            <th>任务完成率</th>
            <th>最近更新</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const completed = completedByProject.get(project.id) ?? 0;
            const total = project._count.testTasks;
            return (
              <tr key={project.id} className="border-b">
                <td className="py-3">
                  <Link href={`/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td>{project.industry ?? "-"}</td>
                <td>{project.type}</td>
                <td>{project.status}</td>
                <td>{total === 0 ? "-" : `${completed}/${total}`}</td>
                <td>{project.updatedAt.toLocaleDateString("zh-CN")}</td>
              </tr>
            );
          })}
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-gray-400">
                暂无项目，点击右上角新建项目开始第一次 GEO 诊断。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 3: Create the new-project page**

Create `src/app/projects/new/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROJECT_TYPES = ["样板报告", "客户诊断", "月度复测"] as const;

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(PROJECT_TYPES[0]);
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, type, industry: industry || undefined }),
    });

    if (!res.ok) {
      setError("创建失败，请检查项目名称和类型。");
      setSubmitting(false);
      return;
    }

    const project = await res.json();
    router.push(`/projects/${project.id}`);
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">新建项目</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">项目名称</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">项目类型</label>
          <select className="w-full rounded border px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">行业（可选）</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "创建中..." : "创建项目"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Manual verification**

Run: `pnpm dev`
Open `http://localhost:3000` in a browser. Expected: empty project table with a "新建项目" button. Click it, fill the form, submit. Expected: redirected to `/projects/<new-id>` (404 page is fine for now — the detail page is built in Task 12). Go back to `/` and confirm the new project now appears in the list.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/projects/new
git commit -m "feat: add root layout, project list page, and new project page"
```

---

## Task 12: Project Detail Page + Brands & Competitors Page

**Files:**
- Create: `src/app/projects/[id]/page.tsx`
- Create: `src/app/projects/[id]/brands/page.tsx`
- Create: `src/app/projects/[id]/brands/brand-manager.tsx`

- [ ] **Step 1: Create the project detail page**

Create `src/app/projects/[id]/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      projectBrands: { include: { brand: true } },
      _count: { select: { questions: true, testTasks: true } },
    },
  });

  if (!project) {
    notFound();
  }

  const [completedCount, distinctPlatforms] = await Promise.all([
    prisma.testTask.count({ where: { projectId: id, status: "completed" } }),
    prisma.testTask.findMany({
      where: { projectId: id },
      select: { platformId: true },
      distinct: ["platformId"],
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <span className="rounded bg-gray-100 px-2 py-1 text-sm">{project.status}</span>
      </div>
      <p className="mb-8 text-sm text-gray-500">
        {project.type} · {project.industry ?? "未设置行业"}
      </p>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard label="品牌数" value={project.projectBrands.length} />
        <StatCard label="问题数" value={project._count.questions} />
        <StatCard label="覆盖平台数" value={distinctPlatforms.length} />
        <StatCard label="任务完成率" value={`${completedCount}/${project._count.testTasks}`} />
      </div>

      <nav className="mb-8 flex gap-4 text-sm">
        <Link className="text-blue-600 hover:underline" href={`/projects/${id}/brands`}>
          品牌与竞品 →
        </Link>
        <Link className="text-blue-600 hover:underline" href={`/projects/${id}/questions`}>
          问题库 →
        </Link>
        <Link className="text-blue-600 hover:underline" href={`/projects/${id}/tasks`}>
          测试任务 →
        </Link>
        <span className="text-gray-400">指标分析（M2 开放）</span>
        <span className="text-gray-400">报告生成（M3 开放）</span>
      </nav>

      <section>
        <h2 className="mb-3 font-medium">目标品牌</h2>
        <ul className="space-y-1 text-sm">
          {project.projectBrands.map((pb) => (
            <li key={pb.id}>
              {pb.brand.name} <span className="text-gray-400">({pb.role})</span>
            </li>
          ))}
          {project.projectBrands.length === 0 && (
            <li className="text-gray-400">暂无品牌，请先在「品牌与竞品」中添加。</li>
          )}
        </ul>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create the brands & competitors page (server component)**

Create `src/app/projects/[id]/brands/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrandManager } from "./brand-manager";

export default async function ProjectBrandsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const [boundBrands, allBrands, competitors] = await Promise.all([
    prisma.projectBrand.findMany({
      where: { projectId: id },
      include: { brand: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.competitor.findMany({
      where: { projectId: id },
      include: { targetBrand: true, competitorBrand: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{project.name} · 品牌与竞品</h1>
      <BrandManager
        projectId={id}
        initialBoundBrands={boundBrands}
        allBrands={allBrands}
        initialCompetitors={competitors}
      />
    </main>
  );
}
```

- [ ] **Step 3: Create the client-side brand/competitor manager**

Create `src/app/projects/[id]/brands/brand-manager.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand, Competitor, ProjectBrand } from "@prisma/client";

type BoundBrand = ProjectBrand & { brand: Brand };
type CompetitorRow = Competitor & { targetBrand: Brand; competitorBrand: Brand };

const COMPETITOR_TYPES = ["直接竞品", "替代方案", "国际竞品", "间接竞品"] as const;
const PRIORITIES = ["高", "中", "低"] as const;

export function BrandManager({
  projectId,
  initialBoundBrands,
  allBrands,
  initialCompetitors,
}: {
  projectId: string;
  initialBoundBrands: BoundBrand[];
  allBrands: Brand[];
  initialCompetitors: CompetitorRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [targetBrandId, setTargetBrandId] = useState("");
  const [competitorBrandId, setCompetitorBrandId] = useState("");
  const [competitorType, setCompetitorType] = useState<string>(COMPETITOR_TYPES[0]);
  const [priority, setPriority] = useState<string>(PRIORITIES[1]);
  const [error, setError] = useState<string | null>(null);

  const boundBrandIds = new Set(initialBoundBrands.map((b) => b.brandId));
  const searchResults = useMemo(
    () =>
      query.trim()
        ? allBrands.filter((b) => b.name.includes(query.trim()) && !boundBrandIds.has(b.id)).slice(0, 8)
        : [],
    [query, allBrands, boundBrandIds],
  );

  async function bindBrand(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/brands`, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) {
      setError("添加品牌失败");
      return;
    }
    setQuery("");
    setNewBrandName("");
    router.refresh();
  }

  async function addCompetitor() {
    setError(null);
    if (!targetBrandId || !competitorBrandId) {
      setError("请选择目标品牌和竞品品牌");
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/competitors`, {
      method: "POST",
      body: JSON.stringify({ targetBrandId, competitorBrandId, competitorType, priority }),
    });
    if (!res.ok) {
      setError("添加竞品关系失败（可能已存在该关系）");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 font-medium">已绑定品牌</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {initialBoundBrands.map((pb) => (
            <li key={pb.id} className="rounded border px-3 py-2">
              {pb.brand.name} <span className="text-gray-400">({pb.role})</span> — {pb.brand.industry ?? "未设置行业"}
            </li>
          ))}
          {initialBoundBrands.length === 0 && <li className="text-gray-400">暂无品牌</li>}
        </ul>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">搜索已有品牌复用</label>
            <input
              className="rounded border px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入品牌名称"
            />
            {searchResults.length > 0 && (
              <ul className="mt-1 max-w-xs rounded border bg-white text-sm shadow">
                {searchResults.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left hover:bg-gray-50"
                      onClick={() => bindBrand({ brandId: b.id })}
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">或创建新品牌</label>
            <div className="flex gap-2">
              <input
                className="rounded border px-3 py-2 text-sm"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="新品牌名称"
              />
              <button
                type="button"
                className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={!newBrandName.trim()}
                onClick={() => bindBrand({ name: newBrandName.trim() })}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-medium">竞品关系</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {initialCompetitors.map((c) => (
            <li key={c.id} className="rounded border px-3 py-2">
              {c.targetBrand.name} 的竞品: {c.competitorBrand.name} — {c.competitorType} / 优先级 {c.priority}
            </li>
          ))}
          {initialCompetitors.length === 0 && <li className="text-gray-400">暂无竞品关系</li>}
        </ul>

        <div className="flex flex-wrap items-end gap-3 text-sm">
          <LabeledSelect
            label="目标品牌"
            value={targetBrandId}
            onChange={setTargetBrandId}
            options={initialBoundBrands.map((pb) => [pb.brand.id, pb.brand.name] as [string, string])}
          />
          <LabeledSelect
            label="竞品品牌"
            value={competitorBrandId}
            onChange={setCompetitorBrandId}
            options={allBrands.map((b) => [b.id, b.name] as [string, string])}
          />
          <LabeledSelect
            label="竞品类型"
            value={competitorType}
            onChange={setCompetitorType}
            options={COMPETITOR_TYPES.map((t) => [t, t] as [string, string])}
          />
          <LabeledSelect
            label="优先级"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES.map((p) => [p, p] as [string, string])}
          />
          <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={addCompetitor}>
            添加竞品关系
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
      <select className="rounded border px-2 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">请选择</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 4: Manual verification**

With `pnpm dev` running, open a project's detail page, click into "品牌与竞品". Add a new brand by typing a name and clicking 添加. Confirm it appears in "已绑定品牌" and the page's stat cards update after refresh. Add a second brand, then create a competitor relationship between the two and confirm it appears under "竞品关系". Try adding the exact same competitor relationship again — expect the error message to appear (409 from the API).

- [ ] **Step 5: Commit**

```bash
git add src/app/projects/[id]/page.tsx src/app/projects/[id]/brands
git commit -m "feat: add project detail page and brand/competitor management UI"
```

---

## Task 13: Question Bank Page

**Files:**
- Create: `src/app/projects/[id]/questions/page.tsx`
- Create: `src/app/projects/[id]/questions/question-manager.tsx`

- [ ] **Step 1: Create the questions page (server component)**

Create `src/app/projects/[id]/questions/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionManager } from "./question-manager";

export default async function ProjectQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const projectQuestions = await prisma.projectQuestion.findMany({
    where: { projectId: id },
    include: { question: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{project.name} · 问题库</h1>
      <QuestionManager projectId={id} initialQuestions={projectQuestions.map((pq) => pq.question)} />
    </main>
  );
}
```

- [ ] **Step 2: Create the client-side question manager**

Create `src/app/projects/[id]/questions/question-manager.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@prisma/client";

const QUESTION_TYPES = ["品类推荐", "竞品对比", "场景解决", "采购决策", "替代方案", "品牌认知", "风险口碑"] as const;

export function QuestionManager({
  projectId,
  initialQuestions,
}: {
  projectId: string;
  initialQuestions: Question[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [type, setType] = useState<string>(QUESTION_TYPES[0]);
  const [batchText, setBatchText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function addSingle() {
    if (!text.trim()) return;
    setError(null);
    const res = await fetch("/api/questions", {
      method: "POST",
      body: JSON.stringify({ questionText: text.trim(), questionType: type, projectId }),
    });
    if (!res.ok) {
      setError("添加问题失败");
      return;
    }
    setText("");
    router.refresh();
  }

  async function importBatch() {
    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setImporting(true);
    setError(null);
    const res = await fetch("/api/questions/batch-import", {
      method: "POST",
      body: JSON.stringify({ projectId, questions: lines.map((questionText) => ({ questionText })) }),
    });
    setImporting(false);

    if (!res.ok) {
      setError("批量导入失败");
      return;
    }
    setBatchText("");
    router.refresh();
  }

  async function toggleStatus(question: Question) {
    const nextStatus = question.status === "active" ? "deprecated" : "active";
    const res = await fetch(`/api/questions/${question.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-medium">新增单条问题</h2>
          <textarea
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例如：CRM 行业有哪些值得推荐的厂商？"
          />
          <select
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" className="rounded bg-black px-3 py-2 text-sm text-white" onClick={addSingle}>
            添加问题
          </button>
        </div>

        <div>
          <h2 className="mb-2 font-medium">批量导入（每行一个问题）</h2>
          <textarea
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            rows={5}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={"问题一\n问题二\n问题三"}
          />
          <button
            type="button"
            disabled={importing}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={importBatch}
          >
            {importing ? "导入中..." : "批量导入"}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="mb-3 font-medium">问题列表（{initialQuestions.length}）</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">问题内容</th>
              <th>类型</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initialQuestions.map((q) => (
              <tr key={q.id} className="border-b">
                <td className="py-2">{q.questionText}</td>
                <td>{q.questionType ?? "-"}</td>
                <td>{q.status}</td>
                <td>
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => toggleStatus(q)}>
                    {q.status === "active" ? "废弃" : "启用"}
                  </button>
                </td>
              </tr>
            ))}
            {initialQuestions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400">
                  暂无问题，请在左侧新增或批量导入。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

With `pnpm dev` running, open a project's "问题库" page. Add one question via the single form, then paste 3 lines into the batch textarea and import. Confirm all 4 appear in the list. Click "废弃" on one and confirm its status flips and the button label changes to "启用".

- [ ] **Step 4: Commit**

```bash
git add src/app/projects/[id]/questions
git commit -m "feat: add question bank page with single add and batch import"
```

---

## Task 14: Test Tasks List Page + Single Task Execution Page

**Files:**
- Create: `src/app/projects/[id]/tasks/page.tsx`
- Create: `src/app/projects/[id]/tasks/task-generator.tsx`
- Create: `src/app/tasks/[id]/page.tsx`
- Create: `src/app/tasks/[id]/task-answer-form.tsx`

- [ ] **Step 1: Create the tasks list page (server component)**

Create `src/app/projects/[id]/tasks/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskGenerator } from "./task-generator";

const PAGE_SIZE = 50;

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { id } = await params;
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const [activeQuestions, platforms, boundBrands, tasks, total] = await Promise.all([
    prisma.projectQuestion.findMany({
      where: { projectId: id, question: { status: "active" } },
      include: { question: true },
    }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.projectBrand.findMany({ where: { projectId: id, role: "target" }, include: { brand: true } }),
    prisma.testTask.findMany({
      where: { projectId: id, ...(status ? { status } : {}) },
      include: { question: true, platform: true, targetBrand: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.testTask.count({ where: { projectId: id, ...(status ? { status } : {}) } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{project.name} · 测试任务</h1>

      <TaskGenerator
        projectId={id}
        questions={activeQuestions.map((pq) => pq.question)}
        platforms={platforms}
        brands={boundBrands.map((pb) => pb.brand)}
      />

      <div className="mb-3 mt-10 flex gap-3 text-sm">
        {["", "pending", "completed", "needs_review", "abnormal"].map((s) => (
          <Link
            key={s}
            href={`/projects/${id}/tasks${s ? `?status=${s}` : ""}`}
            className={`rounded px-2 py-1 ${status === s || (!status && s === "") ? "bg-black text-white" : "bg-gray-100"}`}
          >
            {s === "" ? "全部" : s}
          </Link>
        ))}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">问题</th>
            <th>平台</th>
            <th>目标品牌</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b">
              <td className="max-w-sm truncate py-2">{task.question.questionText}</td>
              <td>{task.platform.name}</td>
              <td>{task.targetBrand.name}</td>
              <td>{task.status}</td>
              <td>
                <Link className="text-blue-600 hover:underline" href={`/tasks/${task.id}`}>
                  执行 →
                </Link>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">
                暂无任务，请先在上方生成测试任务。
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/projects/${id}/tasks?${status ? `status=${status}&` : ""}page=${p}`}
              className={`rounded px-2 py-1 ${p === page ? "bg-black text-white" : "bg-gray-100"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create the client-side task generator panel**

Create `src/app/projects/[id]/tasks/task-generator.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand, Platform, Question } from "@prisma/client";

export function TaskGenerator({
  projectId,
  questions,
  platforms,
  brands,
}: {
  projectId: string;
  questions: Question[];
  platforms: Platform[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(questions.map((q) => q.id));
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>(platforms.map((p) => p.id));
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(brands.map((b) => b.id));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function generate() {
    if (selectedQuestionIds.length === 0 || selectedPlatformIds.length === 0 || selectedBrandIds.length === 0) {
      setResult("请至少选择一个问题、一个平台和一个品牌");
      return;
    }

    setGenerating(true);
    setResult(null);
    const res = await fetch(`/api/projects/${projectId}/tasks/generate`, {
      method: "POST",
      body: JSON.stringify({
        questionIds: selectedQuestionIds,
        platformIds: selectedPlatformIds,
        brandIds: selectedBrandIds,
      }),
    });
    setGenerating(false);

    if (!res.ok) {
      setResult("生成失败");
      return;
    }

    const body = await res.json();
    setResult(`新生成 ${body.createdCount} 条测试任务`);
    router.refresh();
  }

  return (
    <section className="rounded border p-4">
      <h2 className="mb-3 font-medium">生成测试任务</h2>
      <div className="mb-3 grid grid-cols-3 gap-4 text-sm">
        <CheckboxGroup
          title={`问题 (${selectedQuestionIds.length}/${questions.length})`}
          items={questions.map((q) => [q.id, q.questionText] as [string, string])}
          selected={selectedQuestionIds}
          onToggle={(id) => toggle(selectedQuestionIds, setSelectedQuestionIds, id)}
        />
        <CheckboxGroup
          title={`平台 (${selectedPlatformIds.length}/${platforms.length})`}
          items={platforms.map((p) => [p.id, p.name] as [string, string])}
          selected={selectedPlatformIds}
          onToggle={(id) => toggle(selectedPlatformIds, setSelectedPlatformIds, id)}
        />
        <CheckboxGroup
          title={`品牌 (${selectedBrandIds.length}/${brands.length})`}
          items={brands.map((b) => [b.id, b.name] as [string, string])}
          selected={selectedBrandIds}
          onToggle={(id) => toggle(selectedBrandIds, setSelectedBrandIds, id)}
        />
      </div>
      <button
        type="button"
        disabled={generating}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        onClick={generate}
      >
        {generating ? "生成中..." : "生成测试任务"}
      </button>
      {result && <p className="mt-2 text-sm text-gray-600">{result}</p>}
    </section>
  );
}

function CheckboxGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: [string, string][];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{title}</p>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
        {items.map(([id, label]) => (
          <label key={id} className="flex items-center gap-2 truncate">
            <input type="checkbox" checked={selected.includes(id)} onChange={() => onToggle(id)} />
            <span className="truncate">{label}</span>
          </label>
        ))}
        {items.length === 0 && <p className="text-gray-400">无可选项</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the single task execution page (server component)**

Create `src/app/tasks/[id]/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskAnswerForm } from "./task-answer-form";

export default async function TaskExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await prisma.testTask.findUnique({
    where: { id },
    include: { question: true, platform: true, targetBrand: true, project: true },
  });

  if (!task) {
    notFound();
  }

  const nextTask = await prisma.testTask.findFirst({
    where: { projectId: task.projectId, status: "pending", createdAt: { gt: task.createdAt } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link
        href={`/projects/${task.projectId}/tasks`}
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        ← 返回任务列表
      </Link>
      <h1 className="mb-1 text-xl font-semibold">{task.platform.name}</h1>
      <p className="mb-6 text-sm text-gray-500">目标品牌：{task.targetBrand.name}</p>
      <TaskAnswerForm task={task} nextTaskId={nextTask?.id ?? null} />
    </main>
  );
}
```

- [ ] **Step 4: Create the client-side answer form**

Create `src/app/tasks/[id]/task-answer-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Brand, Platform, Question, TestTask } from "@prisma/client";

type TaskWithRelations = TestTask & { question: Question; platform: Platform; targetBrand: Brand };

export function TaskAnswerForm({ task, nextTaskId }: { task: TaskWithRelations; nextTaskId: string | null }) {
  const router = useRouter();
  const [answerText, setAnswerText] = useState(task.answerText ?? "");
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyQuestion() {
    await navigator.clipboard.writeText(task.question.questionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveAnswer() {
    if (!answerText.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${task.id}/answer`, {
      method: "POST",
      body: JSON.stringify({ answerText: answerText.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      const body = await res.json();
      setStatus(body.status);
      router.refresh();
    }
  }

  async function markAbnormal() {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "abnormal" }),
    });
    if (res.ok) {
      setStatus("abnormal");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">提问内容</label>
          <button type="button" onClick={copyQuestion} className="text-xs text-blue-600 hover:underline">
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <p className="rounded border bg-gray-50 px-3 py-2 text-sm">{task.question.questionText}</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">粘贴 AI 回答</label>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          rows={10}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder={`将 ${task.platform.name} 的完整回答粘贴到这里`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving || !answerText.trim()}
          onClick={saveAnswer}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存回答"}
        </button>
        <button type="button" onClick={markAbnormal} className="rounded border px-3 py-2 text-sm">
          标记异常
        </button>
        <span className="text-sm text-gray-500">当前状态：{status}</span>
      </div>

      {nextTaskId && (
        <Link href={`/tasks/${nextTaskId}`} className="inline-block text-sm text-blue-600 hover:underline">
          下一条任务 →
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

With `pnpm dev` running and a project that has questions and a bound brand, open its "测试任务" page. Confirm the generator panel lists the questions/platforms/brands with everything pre-checked, click "生成测试任务", and confirm the success message shows the expected count (`questions x platforms x brands`). Click "执行" on one row, copy the question, paste a fake answer, save it, and confirm the status flips to `completed` and "下一条任务" navigates to the next pending task. Click a status filter chip and confirm the table narrows correctly.

- [ ] **Step 6: Commit**

```bash
git add src/app/projects/[id]/tasks src/app/tasks
git commit -m "feat: add test task generation panel, list page, and execution page"
```

---

## Task 15: AI Platform Settings Page

**Files:**
- Create: `src/app/settings/platforms/page.tsx`
- Create: `src/app/settings/platforms/platform-editor.tsx`

- [ ] **Step 1: Create the settings page (server component)**

Create `src/app/settings/platforms/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";
import { PlatformEditor } from "./platform-editor";

export default async function PlatformSettingsPage() {
  const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">AI 平台配置</h1>
      <PlatformEditor initialPlatforms={platforms} />
    </main>
  );
}
```

- [ ] **Step 2: Create the client-side platform editor**

Create `src/app/settings/platforms/platform-editor.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@prisma/client";

export function PlatformEditor({ initialPlatforms }: { initialPlatforms: Platform[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updatePlatform(
    id: string,
    data: Partial<Pick<Platform, "supportsCitation" | "supportsWebSearch" | "notes">>,
  ) {
    setSavingId(id);
    await fetch(`/api/platforms/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    setSavingId(null);
    router.refresh();
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">平台</th>
          <th>地区</th>
          <th>支持引用源</th>
          <th>支持联网</th>
          <th>测试方式</th>
        </tr>
      </thead>
      <tbody>
        {initialPlatforms.map((platform) => (
          <tr key={platform.id} className="border-b">
            <td className="py-3 font-medium">{platform.name}</td>
            <td>{platform.region}</td>
            <td>
              <input
                type="checkbox"
                checked={platform.supportsCitation}
                disabled={savingId === platform.id}
                onChange={(e) => updatePlatform(platform.id, { supportsCitation: e.target.checked })}
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={platform.supportsWebSearch}
                disabled={savingId === platform.id}
                onChange={(e) => updatePlatform(platform.id, { supportsWebSearch: e.target.checked })}
              />
            </td>
            <td>{platform.testMethod}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Manual verification**

Open `/settings/platforms`. Confirm all 5 seeded platforms appear. Toggle "支持联网" for one platform and confirm it persists after a page reload (refetch from the DB).

- [ ] **Step 4: Commit**

```bash
git add src/app/settings/platforms
git commit -m "feat: add AI platform settings page"
```

---

## Task 16: End-to-End Acceptance Verification

**Goal:** Prove the full PRD §11.1 M1 acceptance flow works end-to-end against a running server, then confirm the actual UI (not just the API) carries a user through it.

**Files:**
- Create: `scripts/verify-m1-flow.mjs`
- Modify: `package.json` (add `verify:m1` script)

- [ ] **Step 1: Write the acceptance flow script**

Create `scripts/verify-m1-flow.mjs`:
```js
const BASE = "http://localhost:3000";

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    throw new Error(`POST ${url} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const project = await postJson(`${BASE}/api/projects`, {
    name: "验证流程项目",
    type: "样板报告",
    industry: "B2B SaaS",
  });
  console.log("created project", project.id);

  const targetLink = await postJson(`${BASE}/api/projects/${project.id}/brands`, {
    name: "纷享销客",
    industry: "CRM",
  });
  const targetBrandId = targetLink.brand.id;
  console.log("bound target brand", targetBrandId);

  const competitorLink = await postJson(`${BASE}/api/projects/${project.id}/brands`, {
    name: "销售易",
  });
  const competitorBrandId = competitorLink.brand.id;

  await postJson(`${BASE}/api/projects/${project.id}/competitors`, {
    targetBrandId,
    competitorBrandId,
    competitorType: "直接竞品",
    priority: "高",
  });
  console.log("added competitor relationship");

  const questionTexts = Array.from({ length: 5 }, (_, i) => ({ questionText: `验证问题 ${i + 1}` }));
  const imported = await postJson(`${BASE}/api/questions/batch-import`, {
    projectId: project.id,
    questions: questionTexts,
  });
  console.log("imported questions", imported.length);

  const platforms = await (await fetch(`${BASE}/api/platforms`)).json();

  const generated = await postJson(`${BASE}/api/projects/${project.id}/tasks/generate`, {
    questionIds: imported.map((q) => q.id),
    platformIds: platforms.map((p) => p.id),
    brandIds: [targetBrandId],
  });
  const expectedCount = imported.length * platforms.length;
  console.log(`generated ${generated.createdCount} tasks (expected ${expectedCount})`);
  if (generated.createdCount !== expectedCount) {
    throw new Error("task count mismatch");
  }

  const tasksBody = await (await fetch(`${BASE}/api/projects/${project.id}/tasks?pageSize=1`)).json();
  const firstTask = tasksBody.items[0];

  const answered = await postJson(`${BASE}/api/tasks/${firstTask.id}/answer`, {
    answerText: "纷享销客是国内领先的 CRM 厂商，常被与销售易对比。",
  });
  console.log("answered task, status:", answered.status);
  if (answered.status !== "completed") {
    throw new Error("expected task status to be completed after answering");
  }

  const projectDetail = await (await fetch(`${BASE}/api/projects/${project.id}`)).json();
  console.log("project detail counts:", projectDetail._count);

  console.log("M1 ACCEPTANCE FLOW: PASS");
}

main().catch((err) => {
  console.error("M1 ACCEPTANCE FLOW: FAIL");
  console.error(err);
  process.exit(1);
});
```

Add to `package.json` `"scripts"`:
```json
"verify:m1": "node scripts/verify-m1-flow.mjs"
```

- [ ] **Step 2: Run it against a live dev server**

Run (in one terminal):
```bash
pnpm dev
```

Run (in a second terminal, against the project's seeded platforms — re-seed first if the dev database was reset):
```bash
pnpm dlx prisma db seed
pnpm verify:m1
```
Expected: every step logs success and the script ends with `M1 ACCEPTANCE FLOW: PASS`. This directly encodes the PRD §11.1 flow: 创建项目 → 添加品牌和竞品 → 导入问题 → 选择平台 → 生成测试任务 → 粘贴回答.

- [ ] **Step 3: Manual UI walkthrough**

The script above only proves the API chain works — walk the actual pages once with a browser to confirm the UI wiring (this is the project the script created, visible at the URL printed by its first log line's id):

1. Open `/` — confirm the "验证流程项目" row shows a non-zero task completion fraction.
2. Open the project, then "品牌与竞品" — confirm 纷享销客 and 销售易 both appear, with the competitor relationship listed.
3. Open "问题库" — confirm the 5 imported questions appear and "废弃" toggles correctly.
4. Open "测试任务" — confirm the task count matches `questions x platforms` (5 questions x platform count), and that the task answered by the script already shows `completed`.
5. Click into a still-`pending` task, copy the question, paste any text as the answer, save, and confirm it flips to `completed` and "下一条任务" advances.
6. Open `/settings/platforms` — confirm all 5 platforms are listed and a toggle persists after reload.

- [ ] **Step 4: Run the full automated test suite one final time**

Run: `pnpm test`
Expected: every test file written across Tasks 4-10 passes.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-m1-flow.mjs package.json
git commit -m "test: add M1 end-to-end acceptance flow script"
```

---

## Plan Complete

Once Task 16 passes, M1 is done: a user can create a project, manage brands/competitors, build a question bank, generate test tasks across platforms and brands, and record pasted AI answers — all traceable back to project/question/platform/brand per PRD §11.2.

**Explicitly not built yet (next plans):**
- M2: LLM answer parsing (`answer_analyses` table, LLM provider abstraction, confidence/retry handling), metrics calculation (`project_metrics`, the 9 formulas in tech doc §5.6), metrics analysis page.
- M3: Markdown report generation (`reports` table, template engine, report editor page, export).
- Explicitly deferred per tech doc milestones: screenshot upload (M4), PDF/PPT export, browser extension, API/RPA auto-testing, auth/multi-tenant.

