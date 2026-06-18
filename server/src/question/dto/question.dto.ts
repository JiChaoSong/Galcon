import { z } from 'zod'

export const createQuestionSchema = z.object({
  text: z.string().min(1, '问题内容不能为空').max(5000),
  industry: z.string().max(100).optional().nullable(),
  type: z.enum([
    'category_recommend',
    'competitor_compare',
    'scenario_solve',
    'purchase_decision',
    'alternative',
    'brand_perception',
    'risk_reputation',
  ]),
  intent: z.string().max(200).optional().nullable(),
  difficulty: z.enum(['basic', 'medium', 'deep']).optional(),
  sortOrder: z.number().int().optional(),
  analysisOrder: z.number().int().optional(),
  analysisPhase: z.string().max(200).optional().nullable(),
  globalTestOrder: z.number().int().optional(),
  testBatch: z.string().max(50).optional().nullable(),
  isGeneral: z.boolean().optional(),
  createdByAI: z.boolean().optional(),
  status: z.enum(['pending', 'enabled', 'deprecated']).optional(),
})

export const updateQuestionSchema = createQuestionSchema.partial()

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>
