import { z } from 'zod'

export const createBrandSchema = z.object({
  name: z.string().min(1, '品牌名不能为空').max(100),
  website: z.string().max(300).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  intro: z.string().max(5000).optional().nullable(),
  customers: z.string().max(5000).optional().nullable(),
  products: z.string().max(5000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export const updateBrandSchema = createBrandSchema.partial()

export const createCompetitorSchema = z.object({
  competitorName: z.string().min(1, '竞品名不能为空').max(100),
  type: z.enum(['direct', 'alternative', 'international', 'indirect']),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  notes: z.string().max(5000).optional().nullable(),
})

export type CreateBrandDto = z.infer<typeof createBrandSchema>
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>
