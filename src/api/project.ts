import request from '@/utils/request'

// ── 类型（与服务端 Prisma schema 对齐） ──

export interface ProjectItem {
  id: string
  name: string
  type: 'sample' | 'client' | 'monthly'
  industry: string
  subIndustry?: string | null
  targetMarket?: string | null
  status: 'preparing' | 'testing' | 'analyzing' | 'completed'
  startDate?: string | null
  endDate?: string | null
  owner: string
  description?: string | null
  taskTotal: number
  taskDone: number
  createdAt: string
  updatedAt: string
}

export interface ProjectDetail extends ProjectItem {
  brands: any[]
  questions: { id: string }[]
  batches: { id: string }[]
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CreateProjectForm {
  name: string
  type: string
  industry: string
  status?: string
  owner: string
  description?: string
  taskTotal?: number
  subIndustry?: string
  targetMarket?: string
  brandName?: string
  brandWebsite?: string
  brandIntro?: string
}

export type UpdateProjectForm = Partial<CreateProjectForm>

// ── API ──

export function getProjects(params?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResult<ProjectItem>> {
  return request.get('/projects', { params })
}

export function getProject(id: string): Promise<ProjectDetail> {
  return request.get(`/projects/${id}`)
}

export function createProject(data: CreateProjectForm): Promise<ProjectItem> {
  return request.post('/projects', data)
}

export function updateProject(
  id: string,
  data: UpdateProjectForm,
): Promise<ProjectItem> {
  return request.patch(`/projects/${id}`, data)
}

export function deleteProject(id: string): Promise<void> {
  return request.delete(`/projects/${id}`)
}
