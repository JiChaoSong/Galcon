import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  addCompetitor,
  deleteCompetitor,
} from '@/api/brand'
import type {
  BrandItem,
  CreateBrandForm,
  UpdateBrandForm,
  CompetitorItem,
  CreateCompetitorForm,
} from '@/api/brand'

// ── 类型导出（兼容旧版） ──
export type Brand = BrandItem
export type Competitor = CompetitorItem

// ── 竞品类型 / 优先级映射 ──
export const competitorTypeMap: Record<string, string> = {
  direct: '直接竞品',
  alternative: '替代方案',
  international: '国际竞品',
  indirect: '间接竞品',
}
export const priorityMap: Record<string, { label: string; color: string }> = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'orange' },
  low: { label: '低', color: 'default' },
}

export const useBrandStore = defineStore('brand', () => {
  const brands = ref<BrandItem[]>([])
  const competitors = ref<CompetitorItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── 加载品牌 ──
  async function fetchBrands(projectId: string) {
    loading.value = true
    error.value = null
    try {
      const data = await getBrands(projectId)
      brands.value = data
      // 收集所有竞品
      competitors.value = data.flatMap((b) =>
        (b.competitors ?? []).map((c) => ({
          ...c,
          projectId: c.projectId || projectId,
          brandId: c.brandId || b.id,
        })),
      )
    } catch (e: any) {
      error.value = e?.message ?? '加载品牌失败'
    } finally {
      loading.value = false
    }
  }

  // ── 品牌 CRUD ──
  async function addBrand(projectId: string, data: CreateBrandForm) {
    loading.value = true
    error.value = null
    try {
      const created = await createBrand(projectId, data)
      brands.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.message ?? '创建品牌失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateBrandAction(
    projectId: string,
    id: string,
    data: UpdateBrandForm,
  ) {
    loading.value = true
    error.value = null
    try {
      const updated = await updateBrand(projectId, id, data)
      const idx = brands.value.findIndex((b) => b.id === id)
      if (idx !== -1) brands.value[idx] = { ...brands.value[idx], ...updated }
      return updated
    } catch (e: any) {
      error.value = e?.message ?? '更新品牌失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeBrand(projectId: string, id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteBrand(projectId, id)
      brands.value = brands.value.filter((b) => b.id !== id)
      competitors.value = competitors.value.filter((c) => c.brandId !== id)
    } catch (e: any) {
      error.value = e?.message ?? '删除品牌失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── 竞品 CRUD ──
  async function addCompetitorAction(
    projectId: string,
    brandId: string,
    data: CreateCompetitorForm,
  ) {
    loading.value = true
    error.value = null
    try {
      const created = await addCompetitor(projectId, brandId, data)
      competitors.value.push(created)
      return created
    } catch (e: any) {
      error.value = e?.message ?? '添加竞品失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeCompetitorAction(
    projectId: string,
    brandId: string,
    compId: string,
  ) {
    loading.value = true
    error.value = null
    try {
      await deleteCompetitor(projectId, brandId, compId)
      competitors.value = competitors.value.filter((c) => c.id !== compId)
    } catch (e: any) {
      error.value = e?.message ?? '删除竞品失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  function getBrandCompetitors(brandId: string): CompetitorItem[] {
    return competitors.value.filter((c) => c.brandId === brandId)
  }

  return {
    brands,
    competitors,
    loading,
    error,
    fetchBrands,
    addBrand,
    updateBrand: updateBrandAction,
    removeBrand,
    addCompetitor: addCompetitorAction,
    removeCompetitor: removeCompetitorAction,
    getBrandCompetitors,
  }
})
