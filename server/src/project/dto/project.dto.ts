import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100),
  type: z.enum(['sample', 'client', 'monthly']),
  industry: z.string().min(1, '行业不能为空').max(100),
  subIndustry: z.string().max(100).optional().nullable(),
  targetMarket: z.string().max(100).optional().nullable(),
  status: z.enum(['preparing', 'testing', 'analyzing', 'completed']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  owner: z.string().min(1, '负责人不能为空').max(50),
  description: z.string().max(5000).optional().nullable(),
  taskTotal: z.number().int().min(0).max(10000).optional(),
  brandName: z.string().max(100).optional(),
  brandWebsite: z.string().max(300).optional(),
  brandIntro: z.string().max(5000).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectDto = z.infer<typeof createProjectSchema>
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>
