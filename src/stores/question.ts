import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/api/question'
import type {
  QuestionItem,
  CreateQuestionForm,
  UpdateQuestionForm,
} from '@/api/question'

// ── 类型导出（兼容旧版） ──
export type Question = QuestionItem

// ── 枚举映射 ──
export const questionTypeMap: Record<string, string> = {
  category_recommend: '品类推荐',
  competitor_compare: '竞品对比',
  scenario_solve: '场景解决',
  purchase_decision: '采购决策',
  alternative: '替代方案',
  brand_perception: '品牌认知',
  risk_reputation: '风险口碑',
}

export const difficultyMap: Record<string, { label: string; color: string }> = {
  basic: { label: '基础', color: 'green' },
  medium: { label: '中等', color: 'orange' },
  deep: { label: '深度', color: 'red' },
}

export const questionStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'default' },
  enabled: { label: '已启用', color: 'success' },
  deprecated: { label: '已废弃', color: 'default' },
}

export const useQuestionStore = defineStore('question', () => {
  const questions = ref<QuestionItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchQuestions(projectId: string) {
    loading.value = true
    error.value = null
    try {
      questions.value = await getQuestions(projectId)
    } catch (e: any) {
      error.value = e?.message ?? '加载问题失败'
    } finally {
      loading.value = false
    }
  }

  async function addQuestion(projectId: string, data: CreateQuestionForm) {
    loading.value = true
    error.value = null
    try {
      const created = await createQuestion(projectId, data)
      questions.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.message ?? '创建问题失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateQuestionAction(
    projectId: string,
    id: string,
    data: UpdateQuestionForm,
  ) {
    loading.value = true
    error.value = null
    try {
      const updated = await updateQuestion(projectId, id, data)
      const idx = questions.value.findIndex((q) => q.id === id)
      if (idx !== -1) questions.value[idx] = { ...questions.value[idx], ...updated }
      return updated
    } catch (e: any) {
      error.value = e?.message ?? '更新问题失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeQuestion(projectId: string, id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteQuestion(projectId, id)
      questions.value = questions.value.filter((q) => q.id !== id)
    } catch (e: any) {
      error.value = e?.message ?? '删除问题失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setStatus(
    projectId: string,
    id: string,
    status: QuestionItem['status'],
  ) {
    return updateQuestionAction(projectId, id, { status })
  }

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    addQuestion,
    updateQuestion: updateQuestionAction,
    removeQuestion,
    setStatus,
  }
})
