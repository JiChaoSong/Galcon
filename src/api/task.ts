import request from '@/utils/request'

// ── 测试批次 ──

export interface TaskBatchItem {
  id: string
  projectId: string
  name: string
  platformId: string
  platformName: string
  brandId: string
  brandName: string
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
  items?: { id: string; status: string }[]
}

export interface CreateBatchForm {
  name: string
  platformId: string
  platformName: string
  brandId: string
  brandName: string
  assignedTo?: string
  items?: { questionId: string; questionText: string }[]
}

export type UpdateBatchForm = Partial<CreateBatchForm>

// ── 测试条目 ──

export interface TaskItemRow {
  id: string
  batchId: string
  questionId: string
  questionText: string
  status: 'pending' | 'done' | 'review' | 'error'
  answerText?: string | null
  testedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateItemForm {
  questionId: string
  questionText: string
}

export interface UpdateItemForm {
  status?: string
  answerText?: string | null
  testedAt?: string | null
}

// ── Batch API（项目嵌套路由） ──

export function getBatches(projectId: string): Promise<TaskBatchItem[]> {
  return request.get(`/projects/${projectId}/batches`)
}

export function createBatch(
  projectId: string,
  data: CreateBatchForm,
): Promise<TaskBatchItem> {
  return request.post(`/projects/${projectId}/batches`, data)
}

// ── Batch API（扁平路由，按 batch ID 操作） ──

export function updateBatch(
  id: string,
  data: UpdateBatchForm,
): Promise<TaskBatchItem> {
  return request.patch(`/batches/${id}`, data)
}

export function deleteBatch(id: string): Promise<void> {
  return request.delete(`/batches/${id}`)
}

export function copyBatch(id: string): Promise<TaskBatchItem> {
  return request.post(`/batches/${id}/copy`)
}

// ── Item API（扁平路由） ──

export function getItems(batchId: string): Promise<TaskItemRow[]> {
  return request.get(`/batches/${batchId}/items`)
}

export function addItems(
  batchId: string,
  data: CreateItemForm[],
): Promise<TaskItemRow[]> {
  return request.post(`/batches/${batchId}/items`, data)
}

export function updateItem(
  id: string,
  data: UpdateItemForm,
): Promise<TaskItemRow> {
  return request.patch(`/items/${id}`, data)
}

export function deleteItem(id: string): Promise<void> {
  return request.delete(`/items/${id}`)
}

// ── AI 分析 ──

export interface AnalysisResult {
  id: string
  taskItemId: string
  mentionedBrands: string[]
  targetBrandMentioned: boolean
  targetBrandRank: number
  targetBrandRecommended: boolean
  competitorsMentioned: string[]
  citationSources: string[]
  answerSummary: string | null
  accuracyStatus: 'accurate' | 'partial' | 'wrong' | 'unknown'
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  riskTypes: string[]
  optimizationSuggestions: string | null
  manualChecked: boolean
  createdAt: string
  updatedAt: string
}

export function getAnalysis(taskItemId: string): Promise<AnalysisResult | null> {
  return request.get(`/analyses/${taskItemId}`)
}

export function createAnalysis(taskItemId: string): Promise<AnalysisResult> {
  return request.post('/analyses', { taskItemId })
}

// ── 任务统计 ──

export interface TaskStats {
  total: number
  completed: number
  pending: number
  failed: number
  pass: number
  partial: number
  percent: number
}

export function getTaskStats(projectId: string): Promise<TaskStats> {
  return request.get(`/projects/${projectId}/metrics/task-stats`)
}
