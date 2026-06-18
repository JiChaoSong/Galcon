# GEO 诊断工作台技术方案

## 1. 技术方案概述

GEO 诊断工作台是一个内部使用的半自动化诊断平台，用于支撑品牌 AI 可见性诊断、GEO Audit、月度复测报告和后续 GEO Monitor 产品化。

平台第一阶段不追求完整 SaaS 能力，而是围绕“项目管理、问题库、测试任务、回答解析、指标统计、报告生成”构建最小可用系统。

核心原则：

1. 快速可用。
2. 数据结构清晰。
3. 支持后续产品化。
4. 能够接入大模型。
5. 先半自动，后自动化。
6. 所有诊断结果必须可追溯到原始回答。

---

## 2. 技术目标

### 2.1 MVP 技术目标

1. 支持创建和管理 GEO 诊断项目。
2. 支持品牌、竞品、平台、问题库管理。
3. 支持自动生成测试任务。
4. 支持人工粘贴 AI 平台回答。
5. 支持调用 LLM 自动解析回答。
6. 支持人工校正解析结果。
7. 支持自动计算 GEO 指标。
8. 支持生成 Markdown 报告草稿。
9. 支持导出数据和报告。

### 2.2 后续演进目标

1. 支持图表可视化。
2. 支持 PDF / PPT 导出。
3. 支持复测对比。
4. 支持浏览器插件采集。
5. 支持 API / RPA 自动测试。
6. 支持客户看板。
7. 支持多租户 SaaS。

---

## 3. 推荐技术路线

### 3.1 阶段 0：低代码验证版

适用于第一份样板报告。

建议组合：

```text
飞书多维表格 / Airtable
+
Dify / Coze / n8n
+
大模型 API
+
Markdown 报告模板
```

优点：

1. 最快启动。
2. 成本低。
3. 适合一个人验证业务流程。
4. 不容易陷入开发。

缺点：

1. 系统扩展性有限。
2. 数据结构控制力较弱。
3. 自动化能力有限。
4. 后续大概率需要重构。

---

### 3.2 阶段 1：Web MVP 推荐架构

推荐技术栈：

| 层级 | 推荐方案                                    |
|---|-----------------------------------------|
| 前端 | Nuxt.js + TypeScript + Tailwind CSS     |
| UI 组件 | shadcn/ui                   |
| 后端 | Nuxt.js API Routes / NestJS             |
| 数据库 | PostgreSQL                              |
| ORM | Prisma                                  |
| 文件存储 | S3 兼容对象存储 / Supabase Storage / 本地 MinIO |
| 鉴权 | NuxtAuth / Supabase Auth                |
| LLM 接入 | OpenAI API / 通义 / DeepSeek / Kimi 等可切换  |
| 队列 | BullMQ + Redis                          |
| 报告生成 | Markdown 模板 + PDF 生成                    |
| 部署 | Vercel / Docker / 阿里云 ECS               |
| 日志 | Pino / Winston                          |
| 监控 | Sentry / OpenTelemetry 可后置              |

### 3.3 为什么推荐这套

1. Nuxt.js 适合快速做内部产品。
2. TypeScript 保证后续迭代稳定性。
3. PostgreSQL 适合结构化诊断数据。
4. Prisma 方便快速建模。
5. Markdown 报告最适合早期快速生成和编辑。
6. 后续可以平滑演进成 SaaS。

---

## 4. 系统架构

### 4.1 MVP 架构图

```text
用户浏览器
  ↓
Nuxt.js 前端
  ↓
API 服务层
  ↓
业务服务层
  ├── 项目服务
  ├── 品牌服务
  ├── 问题库服务
  ├── 测试任务服务
  ├── 回答解析服务
  ├── 指标计算服务
  └── 报告生成服务
  ↓
PostgreSQL 数据库
  ↓
文件存储
  ↓
LLM Provider
```

### 4.2 回答解析流程

```text
用户粘贴 AI 回答
↓
保存原始回答
↓
创建解析任务
↓
调用 LLM
↓
返回结构化 JSON
↓
写入 AnswerAnalysis 表
↓
用户人工校验
↓
标记解析结果已确认
↓
触发指标重新计算
```

### 4.3 报告生成流程

```text
选择项目
↓
读取项目数据
↓
读取指标数据
↓
读取分析结论
↓
套用 Markdown 模板
↓
生成报告草稿
↓
用户编辑
↓
导出 Markdown / PDF
```

---

## 5. 核心模块设计

## 5.1 项目管理模块

### 功能

1. 创建项目。
2. 编辑项目。
3. 查看项目列表。
4. 查看项目进度。
5. 归档项目。
6. 复制项目。

### API 示例

```http
POST /api/projects
GET /api/projects
GET /api/projects/:id
PATCH /api/projects/:id
DELETE /api/projects/:id
POST /api/projects/:id/duplicate
```

---

## 5.2 品牌与竞品模块

### 功能

1. 创建品牌。
2. 编辑品牌。
3. 绑定项目。
4. 设置竞品关系。
5. 查看竞品图谱。

### API 示例

```http
POST /api/brands
GET /api/brands
GET /api/brands/:id
PATCH /api/brands/:id

POST /api/projects/:id/brands
POST /api/projects/:id/competitors
GET /api/projects/:id/competitors
```

---

## 5.3 问题库模块

### 功能

1. 创建问题。
2. 批量导入问题。
3. AI 生成问题。
4. 问题分类。
5. 问题审核。
6. 问题复用。

### AI 生成问题输入

```json
{
  "industry": "B2B SaaS",
  "subIndustry": "CRM",
  "targetCustomer": "中小企业销售团队",
  "questionTypes": ["品类推荐", "竞品对比", "采购决策"],
  "count": 50
}
```

### API 示例

```http
POST /api/questions
POST /api/questions/batch-import
POST /api/questions/generate
GET /api/questions
PATCH /api/questions/:id
```

---

## 5.4 测试任务模块

### 功能

1. 基于问题和平台生成任务。
2. 查看任务列表。
3. 复制提问。
4. 粘贴回答。
5. 上传截图。
6. 标记任务状态。
7. 触发回答解析。

### 任务生成逻辑

输入：

```json
{
  "projectId": "project_001",
  "questionIds": ["q001", "q002"],
  "platformIds": ["deepseek", "kimi", "doubao"],
  "brandIds": ["brand_001"]
}
```

输出：

```text
question_count × platform_count × brand_count = task_count
```

第一阶段建议：

```text
50 个问题 × 5 个平台 × 1 个目标品牌 = 250 条测试任务
```

### API 示例

```http
POST /api/projects/:id/tasks/generate
GET /api/projects/:id/tasks
PATCH /api/tasks/:id
POST /api/tasks/:id/answer
POST /api/tasks/:id/analyze
```

---

## 5.5 LLM 回答解析模块

### 功能

将原始 AI 回答解析为结构化数据。

### 输入

1. 目标品牌。
2. 竞品列表。
3. 问题内容。
4. 平台名称。
5. AI 原始回答。
6. 品牌基础信息，可选。

### 输出 JSON

```json
{
  "answer_summary": "回答主要推荐了纷享销客、销售易、Salesforce 等 CRM 系统。",
  "mentioned_brands": [
    {
      "brand_name": "纷享销客",
      "rank": 1,
      "is_target_brand": true,
      "is_recommended": true,
      "mention_context": "被作为国内 CRM 代表厂商推荐"
    }
  ],
  "target_brand_mentioned": true,
  "target_brand_rank": 1,
  "target_brand_recommended": true,
  "competitors_mentioned": ["销售易", "Salesforce"],
  "citation_sources": [
    {
      "source_name": "官网",
      "source_type": "official_website",
      "url": null
    }
  ],
  "accuracy_status": "部分准确",
  "sentiment": "中性",
  "risk_types": ["信息不完整"],
  "risk_notes": "回答没有提及品牌的行业解决方案能力。",
  "optimization_suggestions": [
    "补充官网上的行业解决方案页",
    "增加与主要竞品的对比内容",
    "强化品牌一句话定义"
  ]
}
```

### 解析 Prompt 要求

1. 必须输出合法 JSON。
2. 不允许编造回答中没有出现的品牌。
3. 对品牌是否被推荐要区分“提及”和“主动推荐”。
4. 对无法判断的字段返回 unknown。
5. 保留置信度字段，便于人工复核。

建议增加字段：

```json
{
  "confidence": 0.83,
  "need_manual_review": false
}
```

---

## 5.6 指标计算模块

### 指标计算范围

1. 项目级。
2. 品牌级。
3. 平台级。
4. 问题类型级。
5. 时间周期级。

### 核心计算公式

#### 品牌提及率

```text
品牌提及率 = 目标品牌被提及任务数 / 已完成测试任务数
```

#### 推荐率

```text
推荐率 = 目标品牌被主动推荐任务数 / 已完成测试任务数
```

#### 平均出现位置

```text
平均出现位置 = 所有目标品牌出现排名之和 / 目标品牌被提及次数
```

#### 竞品出现率

```text
竞品出现率 = 出现任一竞品的任务数 / 已完成测试任务数
```

#### 平台覆盖率

```text
平台覆盖率 = 出现目标品牌的平台数 / 测试平台总数
```

#### 问题类型覆盖率

```text
问题类型覆盖率 = 出现目标品牌的问题类型数 / 测试问题类型总数
```

#### 描述准确率

```text
描述准确率 = 准确或基本准确的回答数 / 目标品牌被提及回答数
```

#### 风险率

```text
风险率 = 存在风险类型的回答数 / 已完成测试任务数
```

### API 示例

```http
POST /api/projects/:id/metrics/recalculate
GET /api/projects/:id/metrics
GET /api/projects/:id/metrics/by-platform
GET /api/projects/:id/metrics/by-question-type
```

---

## 5.7 报告生成模块

### 第一阶段输出格式

优先输出 Markdown。

原因：

1. 结构清晰。
2. 易编辑。
3. 易转 PDF。
4. 易沉淀模板。
5. 适合内部快速迭代。

### 报告模板变量

```text
{{project_name}}
{{industry}}
{{test_period}}
{{brand_count}}
{{platform_count}}
{{question_count}}
{{completed_task_count}}
{{brand_mention_rate}}
{{recommendation_rate}}
{{competitor_share}}
{{platform_analysis}}
{{question_type_analysis}}
{{risk_summary}}
{{optimization_suggestions}}
{{ninety_day_plan}}
```

### API 示例

```http
POST /api/projects/:id/reports/generate
GET /api/projects/:id/reports
GET /api/reports/:id
PATCH /api/reports/:id
POST /api/reports/:id/export
```

---

## 6. 数据库设计草案

以下为核心表设计草案。

## 6.1 projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  sub_industry VARCHAR(100),
  target_market VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  description TEXT,
  owner_id UUID,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.2 brands

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  official_website TEXT,
  industry VARCHAR(100),
  product_category VARCHAR(100),
  brand_intro TEXT,
  target_customers TEXT,
  core_products TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.3 project_brands

```sql
CREATE TABLE project_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  brand_id UUID REFERENCES brands(id),
  role VARCHAR(50) DEFAULT 'target',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 6.4 competitors

```sql
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  target_brand_id UUID REFERENCES brands(id),
  competitor_brand_id UUID REFERENCES brands(id),
  competitor_type VARCHAR(50),
  priority VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 6.5 platforms

```sql
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  supports_citation BOOLEAN DEFAULT false,
  supports_web_search BOOLEAN DEFAULT false,
  test_method VARCHAR(50) DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.6 questions

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  industry VARCHAR(100),
  question_type VARCHAR(50),
  intent VARCHAR(100),
  is_general BOOLEAN DEFAULT true,
  difficulty VARCHAR(50),
  created_by_ai BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.7 test_tasks

```sql
CREATE TABLE test_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  question_id UUID REFERENCES questions(id),
  platform_id UUID REFERENCES platforms(id),
  target_brand_id UUID REFERENCES brands(id),
  status VARCHAR(50) DEFAULT 'pending',
  prompt_text TEXT,
  answer_text TEXT,
  screenshot_url TEXT,
  tested_at TIMESTAMP,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.8 answer_analyses

```sql
CREATE TABLE answer_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES test_tasks(id),
  answer_summary TEXT,
  mentioned_brands JSONB,
  target_brand_mentioned BOOLEAN,
  target_brand_rank INTEGER,
  target_brand_recommended BOOLEAN,
  competitors_mentioned JSONB,
  citation_sources JSONB,
  accuracy_status VARCHAR(50),
  sentiment VARCHAR(50),
  risk_types JSONB,
  risk_notes TEXT,
  optimization_suggestions JSONB,
  confidence NUMERIC(4, 3),
  need_manual_review BOOLEAN DEFAULT false,
  manual_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.9 project_metrics

```sql
CREATE TABLE project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  brand_id UUID REFERENCES brands(id),
  metric_scope VARCHAR(50),
  scope_value VARCHAR(255),
  total_tasks INTEGER,
  completed_tasks INTEGER,
  brand_mention_rate NUMERIC(6, 4),
  recommendation_rate NUMERIC(6, 4),
  average_position NUMERIC(6, 2),
  competitor_share NUMERIC(6, 4),
  platform_coverage NUMERIC(6, 4),
  query_coverage NUMERIC(6, 4),
  answer_accuracy_rate NUMERIC(6, 4),
  citation_rate NUMERIC(6, 4),
  risk_rate NUMERIC(6, 4),
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

## 6.10 reports

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  report_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  title VARCHAR(255),
  content_md TEXT,
  export_url TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. 前端页面结构

### 7.1 路由规划

```text
/
  项目列表

/projects/new
  新建项目

/projects/[id]
  项目总览

/projects/[id]/brands
  品牌与竞品

/projects/[id]/questions
  项目问题库

/projects/[id]/tasks
  测试任务列表

/tasks/[id]
  单条任务执行页

/projects/[id]/metrics
  指标分析页

/projects/[id]/reports
  报告列表

/reports/[id]
  报告编辑页

/settings/platforms
  AI 平台配置

/settings/templates
  报告模板配置
```

### 7.2 关键交互

#### 测试任务页

每条任务需要提供：

1. 问题文本。
2. 一键复制按钮。
3. AI 平台名称。
4. 回答粘贴框。
5. 截图上传。
6. 保存回答。
7. 自动解析按钮。
8. 解析结果展示。
9. 人工校正入口。
10. 下一条任务按钮。

#### 指标页

需要提供：

1. 总览卡片。
2. 平台筛选。
3. 问题类型筛选。
4. 品牌筛选。
5. 指标表格。
6. 图表区域。
7. 明细数据跳转。

#### 报告编辑页

需要提供：

1. Markdown 编辑器。
2. 预览区域。
3. 重新生成按钮。
4. 导出按钮。
5. 保存版本按钮。

---

## 8. LLM 接入设计

## 8.1 Provider 抽象

建议封装统一接口：

```ts
interface LLMProvider {
  name: string;
  chat(prompt: string, options?: ChatOptions): Promise<LLMResponse>;
  json<T>(prompt: string, schema?: unknown): Promise<T>;
}
```

后续可接入：

1. OpenAI。
2. DeepSeek。
3. 通义千问。
4. Kimi。
5. 豆包。
6. 本地模型。

## 8.2 解析任务重试机制

LLM 输出可能不稳定，需要：

1. JSON 解析失败自动重试。
2. 缺失必要字段自动修复。
3. 超时重试。
4. 低置信度标记人工复核。
5. 保存原始 LLM 返回。

## 8.3 Prompt 模板版本管理

建议为每类任务保留模板版本：

1. answer_analysis_v1
2. question_generation_v1
3. report_summary_v1
4. optimization_suggestion_v1

每次解析保存 prompt_version，便于后续追溯。

---

## 9. 报告生成设计

## 9.1 Markdown 生成

推荐使用模板引擎：

1. Handlebars
2. Nunjucks
3. 自定义字符串模板

## 9.2 PDF 导出

可选方案：

1. Playwright 渲染 HTML → PDF。
2. Markdown → HTML → PDF。
3. md-to-pdf 工具。
4. 后续接入专业报告排版服务。

## 9.3 PPT 导出

P2 阶段再做。

可选方案：

1. pptxgenjs。
2. HTML Slide 模板。
3. 先导出 Markdown，由人工做 PPT。

第一阶段不建议优先投入 PPT 自动化。

---

## 10. 文件存储设计

需要存储：

1. AI 回答截图。
2. 导出的报告。
3. 客户资料附件。
4. 品牌官网截图，可选。

存储方案：

| 阶段 | 方案 |
|---|---|
| 本地开发 | 本地文件系统 |
| 内部 MVP | Supabase Storage / S3 兼容对象存储 |
| 生产环境 | 阿里云 OSS / 腾讯云 COS / AWS S3 |

---

## 11. 权限设计

第一阶段可以极简。

### v0.2 内部版本

角色：

1. Admin
2. Operator

权限：

| 操作 | Admin | Operator |
|---|---|---|
| 创建项目 | 是 | 是 |
| 删除项目 | 是 | 否 |
| 编辑任务 | 是 | 是 |
| 解析回答 | 是 | 是 |
| 生成报告 | 是 | 是 |
| 管理平台配置 | 是 | 否 |

### v1.0 后续扩展

增加：

1. Sales
2. Customer Success
3. Client Viewer
4. Analyst

---

## 12. 部署方案

## 12.1 本地开发

```text
Node.js
PostgreSQL Docker
Redis Docker
Nuxt.js Dev Server
```

## 12.2 内部 MVP 部署

方案 A：

```text
Vercel
+
Supabase PostgreSQL
+
Supabase Storage
```

优点：最快。

方案 B：

```text
Docker Compose
+
阿里云 ECS
+
PostgreSQL
+
Redis
+
Nginx
```

优点：控制力更强，适合国内访问。

如果面向国内团队使用，建议优先：

```text
阿里云 ECS + Docker Compose + PostgreSQL + Redis + Nginx
```

## 12.3 Docker Compose 服务

```yaml
services:
  app:
    image: geo-workbench-app
    ports:
      - "3000:3000"
    env_file:
      - .env

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: geo_workbench
      POSTGRES_USER: geo
      POSTGRES_PASSWORD: geo_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 13. 非功能需求

### 13.1 性能

MVP 阶段数据量预估：

| 数据 | 数量 |
|---|---:|
| 项目 | 10-100 |
| 品牌 | 100-1000 |
| 问题 | 1000-10000 |
| 测试任务 | 10000-100000 |
| AI 回答 | 10000-100000 |

性能目标：

1. 项目列表 2 秒内加载。
2. 测试任务列表支持分页。
3. 指标统计 5 秒内完成。
4. 报告生成 30 秒内完成。
5. LLM 解析异步执行，避免阻塞页面。

### 13.2 安全

1. API Key 必须存储在服务端环境变量中。
2. 不在前端暴露大模型密钥。
3. 项目数据需鉴权访问。
4. 报告导出链接应有权限控制。
5. 客户数据不用于公开报告，除非授权。

### 13.3 可追溯

1. 每个指标必须能追溯到原始回答。
2. 每条解析结果必须保存解析时间和模型信息。
3. 报告生成需要保存版本。
4. 人工修改解析结果需要记录修改时间。

### 13.4 可扩展

1. AI 平台应可配置。
2. LLM Provider 应可切换。
3. 报告模板应可配置。
4. 指标计算应模块化。
5. 后续可支持多租户。

---

## 14. 开发里程碑

### M0：低代码验证版，3-5 天

目标：

1. 飞书 / Excel 表结构完成。
2. 问题库表完成。
3. 测试任务表完成。
4. LLM 解析 Prompt 完成。
5. Markdown 报告模板完成。

交付：

1. 可跑第一份 B2B SaaS 样板报告。
2. 明确 Web MVP 的真实需求。

---

### M1：Web MVP 基础能力，2 周

目标：

1. 项目管理。
2. 品牌管理。
3. 问题管理。
4. 平台管理。
5. 测试任务生成。
6. 回答录入。

交付：

1. 可以在系统内创建项目并生成测试任务。
2. 可以人工粘贴回答。

---

### M2：解析与指标能力，2 周

目标：

1. 接入 LLM。
2. 自动解析回答。
3. 人工校验解析结果。
4. 自动计算指标。
5. 指标分析页。

交付：

1. 完成项目级指标统计。
2. 支持品牌、平台、问题类型筛选。

---

### M3：报告生成，1-2 周

目标：

1. Markdown 报告生成。
2. 报告编辑。
3. 报告导出。
4. 报告模板管理。

交付：

1. 系统可生成完整样板报告草稿。
2. 报告可人工编辑后导出。

---

### M4：增强能力，持续迭代

目标：

1. 图表可视化。
2. PDF 导出。
3. 复测对比。
4. 优化动作库。
5. 截图上传。
6. 浏览器插件调研。

---

## 15. MVP 开发优先级

### 第一优先级

1. 数据模型。
2. 项目管理。
3. 问题库。
4. 测试任务。
5. 回答录入。
6. LLM 解析。
7. 基础指标。
8. Markdown 报告。

### 暂不做

1. 客户登录。
2. 多租户。
3. 复杂权限。
4. 支付。
5. 自动爬取所有 AI 平台。
6. PPT 自动生成。
7. 大屏展示。
8. 完整 CRM。

---

## 16. 技术风险

### 16.1 AI 平台回答不稳定

解决方案：

1. 保留测试时间。
2. 支持复测。
3. 报告中声明时间窗口。
4. 指标按批次计算。

### 16.2 LLM 解析错误

解决方案：

1. 输出置信度。
2. 人工校验。
3. 低置信度标红。
4. 保存原文。
5. 支持重新解析。

### 16.3 品牌识别不准确

解决方案：

1. 维护品牌别名。
2. 维护中英文名称。
3. 维护产品名。
4. 在解析时传入品牌词典。
5. 人工修正后反哺词典。

### 16.4 报告结论过度自动化

解决方案：

1. 系统只生成报告草稿。
2. 关键结论必须人工确认。
3. 对外报告保留边界声明。
4. 不输出绝对排名承诺。

### 16.5 过早产品化

解决方案：

1. 第一阶段只做内部工具。
2. 以交付效率为核心目标。
3. 不做非必要 SaaS 能力。
4. 每次开发前确认是否能减少人工操作。

---

## 17. 浏览器插件后续方案

当前人工测试流程仍需在 AI 平台中复制问题、粘贴回答。

后续可做浏览器插件，提高采集效率。

### 插件能力

1. 从平台任务页复制问题。
2. 在 AI 平台页面侧边栏显示当前任务。
3. 一键将当前页面回答采集回系统。
4. 自动截图。
5. 自动标记任务完成。

### 技术方案

1. Chrome Extension Manifest V3。
2. Content Script 读取页面文本。
3. Background Script 调用工作台 API。
4. 用户登录工作台后获得 Token。
5. 支持手动选择回答区域。

### 风险

1. 不同 AI 平台页面结构变化。
2. 平台可能限制自动化。
3. 需要确保不违反平台规则。
4. 第一阶段不建议优先开发。

---

## 18. API 自动测试后续方案

部分平台未来可通过 API 自动测试。

### 可自动化条件

1. 平台提供官方 API。
2. API 响应可保存。
3. 成本可控。
4. 模型版本可记录。
5. 结果与用户真实使用场景差异可接受。

### 自动化任务流程

```text
选择问题
↓
选择 API 平台
↓
后台批量调用
↓
保存回答
↓
自动解析
↓
计算指标
```

### 注意

API 回答不一定等同于网页端 AI 搜索回答。报告中需区分：

1. Web 手动测试结果。
2. API 模型测试结果。
3. 联网搜索结果。
4. 非联网模型结果。

---

## 19. 数据模型扩展建议

后续可增加：

1. brand_aliases：品牌别名表。
2. source_entities：信源实体表。
3. optimization_actions：优化动作库。
4. report_templates：报告模板表。
5. test_batches：测试批次表。
6. metric_snapshots：指标快照表。
7. prompt_templates：Prompt 模板表。
8. llm_runs：LLM 调用记录表。
9. audit_logs：操作日志表。

---

## 20. 第一阶段开发任务拆解

### 后端任务

1. 初始化项目。
2. 配置数据库。
3. 设计 Prisma Schema。
4. 实现项目 CRUD。
5. 实现品牌 CRUD。
6. 实现问题 CRUD。
7. 实现平台 CRUD。
8. 实现任务生成。
9. 实现回答保存。
10. 实现 LLM 解析。
11. 实现指标计算。
12. 实现报告生成。

### 前端任务

1. 项目列表页。
2. 新建项目页。
3. 项目详情页。
4. 品牌管理页。
5. 问题库页。
6. 测试任务页。
7. 单条任务执行页。
8. 指标分析页。
9. 报告生成页。
10. 报告编辑页。

### AI 能力任务

1. 回答解析 Prompt。
2. 问题生成 Prompt。
3. 报告摘要 Prompt。
4. 优化建议 Prompt。
5. JSON Schema 校验。
6. 失败重试逻辑。

### 测试任务

1. 项目创建测试。
2. 问题导入测试。
3. 任务生成测试。
4. 回答解析测试。
5. 指标计算测试。
6. 报告生成测试。

---

## 21. MVP 最小实现建议

如果资源极度有限，第一版只做 6 个页面：

1. 项目列表页。
2. 项目详情页。
3. 问题库页。
4. 测试任务页。
5. 指标页。
6. 报告页。

第一版只做 4 张核心表也能跑起来：

1. projects
2. brands
3. questions
4. test_tasks

answer analysis 可以先作为 test_tasks 的 JSON 字段存储，后续再拆表。

但为了后续扩展，建议一开始就拆出 answer_analyses。

---

## 22. 结论

GEO 诊断工作台的技术路线应该遵循：

```text
先内部工具
再标准交付系统
再客户看板
最后 SaaS 化
```

MVP 不追求复杂，而是必须跑通：

```text
项目创建
→ 问题生成
→ 测试任务
→ 回答录入
→ LLM 解析
→ 指标计算
→ 报告生成
```

只要这条链路跑通，就可以支撑第一份 B2B SaaS 品牌 AI 可见性诊断样板报告，并逐步沉淀为 GEO 公司的核心基础设施。
