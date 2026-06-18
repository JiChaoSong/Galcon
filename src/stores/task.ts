import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  copyBatch,
  getItems,
  addItems,
  updateItem,
  deleteItem,
  getAnalysis as getAnalysisApi,
  createAnalysis as createAnalysisApi,
  getTaskStats as getTaskStatsApi,
} from '@/api/task'
import type {
  TaskBatchItem,
  CreateBatchForm,
  UpdateBatchForm,
  TaskItemRow,
  UpdateItemForm,
} from '@/api/task'
import type { TaskStats } from '@/api/task'
import { useProjectStore } from './project'

// ── 导出类型别名（兼容旧版引用） ──
export type TaskBatch = TaskBatchItem
export type TaskItem = TaskItemRow

// ── 解析结果 ──
export interface AnswerAnalysis {
  taskId: string
  mentionedBrands: string[]
  targetBrandMentioned: boolean
  targetBrandRank: number
  targetBrandRecommended: boolean
  competitorsMentioned: string[]
  citationSources: string[]
  answerSummary: string
  accuracyStatus: 'accurate' | 'partial' | 'wrong' | 'unknown'
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  riskTypes: string[]
  manualChecked: boolean
}

export const taskStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待测试', color: 'default' },
  done: { label: '已完成', color: 'success' },
  review: { label: '待复核', color: 'warning' },
  error: { label: '异常', color: 'red' },
}

export const useTaskStore = defineStore('task', () => {
  const batches = ref<TaskBatchItem[]>([])
  const items = ref<TaskItemRow[]>([])
  const analyses = ref<AnswerAnalysis[]>([])
  const taskStats = ref<TaskStats | null>(null)
  const statsLoading = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── 向后兼容：扁平化视图 ──
  const tasks = computed(() => {
    const batchMap = new Map(batches.value.map((b) => [b.id, b]))
    return items.value.map((item) => {
      const batch = batchMap.get(item.batchId)
      return {
        id: item.id,
        projectId: batch?.projectId ?? '',
        questionId: item.questionId,
        questionText: item.questionText,
        platformId: batch?.platformId ?? '',
        platformName: batch?.platformName ?? '',
        brandId: batch?.brandId ?? '',
        brandName: batch?.brandName ?? '',
        status: item.status,
        assignedTo: batch?.assignedTo ?? '',
        promptText: item.questionText,
        answerText: item.answerText,
        screenshotUrl: '',
        testedAt: item.testedAt,
      }
    })
  })

  // ── 加载批次 ──
  async function fetchBatches(projectId: string) {
    loading.value = true
    error.value = null
    try {
      batches.value = await getBatches(projectId)
    } catch (e: any) {
      error.value = e?.message ?? '加载批次失败'
    } finally {
      loading.value = false
    }
  }

  // ── 加载条目 ──
  async function fetchItems(batchId: string) {
    loading.value = true
    error.value = null
    try {
      const newItems = await getItems(batchId)
      // 替换该批次的条目
      items.value = items.value
        .filter((i) => i.batchId !== batchId)
        .concat(newItems)
      return newItems
    } catch (e: any) {
      error.value = e?.message ?? '加载条目失败'
      return []
    } finally {
      loading.value = false
    }
  }

  // ── Batch CRUD ──
  async function addBatch(projectId: string, data: Omit<CreateBatchForm, 'name' | 'platformId' | 'platformName' | 'brandId' | 'brandName'> & CreateBatchForm) {
    loading.value = true
    error.value = null
    try {
      const created = await createBatch(projectId, data)
      batches.value.unshift(created)
      // 同步项目计数
      const projectStore = useProjectStore()
      await projectStore.fetchProjects()
      return created
    } catch (e: any) {
      error.value = e?.message ?? '创建批次失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateBatchAction(id: string, data: UpdateBatchForm) {
    loading.value = true
    error.value = null
    try {
      const updated = await updateBatch(id, data)
      const idx = batches.value.findIndex((b) => b.id === id)
      if (idx !== -1) batches.value[idx] = { ...batches.value[idx], ...updated }
      return updated
    } catch (e: any) {
      error.value = e?.message ?? '更新批次失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeBatch(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteBatch(id)
      batches.value = batches.value.filter((b) => b.id !== id)
      items.value = items.value.filter((i) => i.batchId !== id)
      const projectStore = useProjectStore()
      await projectStore.fetchProjects()
    } catch (e: any) {
      error.value = e?.message ?? '删除批次失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function copyBatchAction(id: string) {
    loading.value = true
    error.value = null
    try {
      const copied = await copyBatch(id)
      batches.value.unshift(copied)
      if (copied.items) {
        items.value = items.value.concat(
          copied.items.map((i: any) => ({ ...i, batchId: copied.id })),
        )
      }
      const projectStore = useProjectStore()
      await projectStore.fetchProjects()
      return copied
    } catch (e: any) {
      error.value = e?.message ?? '复制批次失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Item CRUD ──
  async function addItemsAction(batchId: string, newItems: { questionId: string; questionText: string }[]) {
    loading.value = true
    error.value = null
    try {
      const created = await addItems(batchId, newItems)
      items.value.push(...created)
      const projectStore = useProjectStore()
      await projectStore.fetchProjects()
      return created
    } catch (e: any) {
      error.value = e?.message ?? '添加条目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateItemAction(id: string, data: UpdateItemForm) {
    loading.value = true
    error.value = null
    try {
      const updated = await updateItem(id, data)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], ...updated }
      return updated
    } catch (e: any) {
      error.value = e?.message ?? '更新条目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeItemAction(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteItem(id)
      items.value = items.value.filter((i) => i.id !== id)
      const projectStore = useProjectStore()
      await projectStore.fetchProjects()
    } catch (e: any) {
      error.value = e?.message ?? '删除条目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setItemStatus(id: string, status: TaskItemRow['status']) {
    const data: UpdateItemForm = { status }
    if (status === 'done') {
      data.testedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    return updateItemAction(id, data)
  }

  async function saveAnswer(id: string, answerText: string) {
    return updateItemAction(id, {
      answerText,
      status: 'done',
      testedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
  }

  // ── 便捷查询 ──
  function getBatchItems(batchId: string): TaskItemRow[] {
    return items.value.filter((i) => i.batchId === batchId)
  }

  function getBatch(id: string): TaskBatchItem | undefined {
    return batches.value.find((b) => b.id === id)
  }

  // ── AI 分析 ──
  async function fetchAnalysis(taskId: string): Promise<AnswerAnalysis | null> {
    try {
      const result = await getAnalysisApi(taskId)
      if (!result) return null
      // 同步到本地缓存
      const idx = analyses.value.findIndex((a) => a.taskId === taskId)
      const mapped: AnswerAnalysis = {
        taskId: result.taskItemId,
        mentionedBrands: result.mentionedBrands,
        targetBrandMentioned: result.targetBrandMentioned,
        targetBrandRank: result.targetBrandRank,
        targetBrandRecommended: result.targetBrandRecommended,
        competitorsMentioned: result.competitorsMentioned,
        citationSources: result.citationSources,
        answerSummary: result.answerSummary ?? '',
        accuracyStatus: result.accuracyStatus,
        sentiment: result.sentiment,
        riskTypes: result.riskTypes,
        manualChecked: result.manualChecked,
      }
      if (idx !== -1) {
        analyses.value[idx] = mapped
      } else {
        analyses.value.push(mapped)
      }
      return mapped
    } catch {
      return null
    }
  }

  async function requestAnalysis(taskId: string): Promise<AnswerAnalysis> {
    const result = await createAnalysisApi(taskId)
    const mapped: AnswerAnalysis = {
      taskId: result.taskItemId,
      mentionedBrands: result.mentionedBrands,
      targetBrandMentioned: result.targetBrandMentioned,
      targetBrandRank: result.targetBrandRank,
      targetBrandRecommended: result.targetBrandRecommended,
      competitorsMentioned: result.competitorsMentioned,
      citationSources: result.citationSources,
      answerSummary: result.answerSummary ?? '',
      accuracyStatus: result.accuracyStatus,
      sentiment: result.sentiment,
      riskTypes: result.riskTypes,
      manualChecked: result.manualChecked,
    }
    // 替换已有或新增
    const idx = analyses.value.findIndex((a) => a.taskId === taskId)
    if (idx !== -1) {
      analyses.value[idx] = mapped
    } else {
      analyses.value.push(mapped)
    }
    // 同步项目计数
    const projectStore = useProjectStore()
    await projectStore.fetchProjects()
    return mapped
  }

  async function fetchTaskStats(projectId: string) {
    statsLoading.value = true
    try {
      taskStats.value = await getTaskStatsApi(projectId)
    } catch {
      taskStats.value = null
    } finally {
      statsLoading.value = false
    }
  }

  function getAnalysis(taskId: string): AnswerAnalysis | undefined {
    return analyses.value.find((a) => a.taskId === taskId)
  }

  return {
    batches,
    items,
    analyses,
    taskStats,
    statsLoading,
    tasks,
    loading,
    error,
    fetchBatches,
    fetchItems,
    addBatch,
    updateBatch: updateBatchAction,
    removeBatch,
    copyBatch: copyBatchAction,
    addItem: addItemsAction,
    addItems: addItemsAction,
    updateItem: updateItemAction,
    removeItem: removeItemAction,
    setItemStatus,
    saveAnswer,
    getBatchItems,
    getBatch,
    getAnalysis,
    fetchAnalysis,
    requestAnalysis,
    fetchTaskStats,
  }
})
