import { z } from 'zod'

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
