import request from '@/utils/request'

// ── 品牌 ──

export interface BrandItem {
  id: string
  projectId: string
  name: string
  website?: string | null
  industry?: string | null
  category?: string | null
  intro?: string | null
  customers?: string | null
  products?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  competitors?: CompetitorItem[]
}

// ── 竞品 ──

export interface CompetitorItem {
  id: string
  projectId: string
  brandId: string
  competitorName: string
  type: 'direct' | 'alternative' | 'international' | 'indirect'
  priority: 'high' | 'medium' | 'low'
  notes?: string | null
  createdAt: string
}

export interface CreateBrandForm {
  name: string
  website?: string
  industry?: string
  category?: string
  intro?: string
  customers?: string
  products?: string
  notes?: string
}

export type UpdateBrandForm = Partial<CreateBrandForm>

export interface CreateCompetitorForm {
  competitorName: string
  type: string
  priority?: string
  notes?: string
}

// ── Brand API ──

export function getBrands(projectId: string): Promise<BrandItem[]> {
  return request.get(`/projects/${projectId}/brands`)
}

export function createBrand(
  projectId: string,
  data: CreateBrandForm,
): Promise<BrandItem> {
  return request.post(`/projects/${projectId}/brands`, data)
}

export function updateBrand(
  projectId: string,
  id: string,
  data: UpdateBrandForm,
): Promise<BrandItem> {
  return request.patch(`/projects/${projectId}/brands/${id}`, data)
}

export function deleteBrand(
  projectId: string,
  id: string,
): Promise<void> {
  return request.delete(`/projects/${projectId}/brands/${id}`)
}

// ── Competitor API ──

export function getCompetitors(
  projectId: string,
  brandId: string,
): Promise<CompetitorItem[]> {
  return request.get(`/projects/${projectId}/brands/${brandId}/competitors`)
}

export function addCompetitor(
  projectId: string,
  brandId: string,
  data: CreateCompetitorForm,
): Promise<CompetitorItem> {
  return request.post(
    `/projects/${projectId}/brands/${brandId}/competitors`,
    data,
  )
}

export function deleteCompetitor(
  projectId: string,
  brandId: string,
  compId: string,
): Promise<void> {
  return request.delete(
    `/projects/${projectId}/brands/${brandId}/competitors/${compId}`,
  )
}
