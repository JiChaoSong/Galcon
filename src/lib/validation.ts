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
