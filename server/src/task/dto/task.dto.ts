import { z } from 'zod'

export const createBatchSchema = z.object({
  name: z.string().min(1, '任务名称不能为空').max(100),
  platformId: z.string().min(1, '平台不能为空'),
  platformName: z.string().min(1),
  brandId: z.string().min(1, '品牌不能为空'),
  brandName: z.string().min(1),
  assignedTo: z.string().max(50).optional().nullable(),
  items: z
    .array(
      z.object({
        questionId: z.string().min(1),
        questionText: z.string().min(1),
      }),
    )
    .optional(),
})

export const updateBatchSchema = createBatchSchema.partial()

export const createItemSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().min(1),
})

export const createItemsSchema = z.array(createItemSchema).min(1)

export const updateItemSchema = z.object({
  status: z.enum(['pending', 'done', 'review', 'error']).optional(),
  answerText: z.string().max(10000).optional().nullable(),
  testedAt: z.string().optional().nullable(),
})

export type CreateBatchDto = z.infer<typeof createBatchSchema>
export type UpdateBatchDto = z.infer<typeof updateBatchSchema>
export type CreateItemDto = z.infer<typeof createItemSchema>
export type UpdateItemDto = z.infer<typeof updateItemSchema>
