import { z } from 'zod'

export const createAnalysisSchema = z.object({
  taskItemId: z.string().min(1, '任务条目 ID 不能为空'),
})

export type CreateAnalysisDto = z.infer<typeof createAnalysisSchema>
