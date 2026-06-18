import request from '@/utils/request'

// ── 问题 ──

export interface QuestionItem {
  id: string
  projectId: string
  text: string
  industry?: string | null
  type:
    | 'category_recommend'
    | 'competitor_compare'
    | 'scenario_solve'
    | 'purchase_decision'
    | 'alternative'
    | 'brand_perception'
    | 'risk_reputation'
  intent?: string | null
  difficulty: 'basic' | 'medium' | 'deep'
  sortOrder: number
  analysisOrder: number
  analysisPhase?: string | null
  globalTestOrder: number
  testBatch?: string | null
  isGeneral: boolean
  createdByAI: boolean
  status: 'pending' | 'enabled' | 'deprecated'
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionForm {
  text: string
  industry?: string
  type: string
  intent?: string
  difficulty?: string
  sortOrder?: number
  analysisOrder?: number
  analysisPhase?: string
  globalTestOrder?: number
  testBatch?: string
  isGeneral?: boolean
  createdByAI?: boolean
  status?: string
}

export type UpdateQuestionForm = Partial<CreateQuestionForm>

// ── API ──

export function getQuestions(projectId: string): Promise<QuestionItem[]> {
  return request.get(`/projects/${projectId}/questions`)
}

export function createQuestion(
  projectId: string,
  data: CreateQuestionForm,
): Promise<QuestionItem> {
  return request.post(`/projects/${projectId}/questions`, data)
}

export function updateQuestion(
  projectId: string,
  id: string,
  data: UpdateQuestionForm,
): Promise<QuestionItem> {
  return request.patch(`/projects/${projectId}/questions/${id}`, data)
}

export function deleteQuestion(
  projectId: string,
  id: string,
): Promise<void> {
  return request.delete(`/projects/${projectId}/questions/${id}`)
}
