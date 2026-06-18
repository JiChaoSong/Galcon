import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '@/api/project'
import type {
  ProjectItem,
  ProjectDetail,
  CreateProjectForm,
  UpdateProjectForm,
} from '@/api/project'

export type { ProjectItem as Project, ProjectDetail, CreateProjectForm as ProjectForm }

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectItem[]>([])
  const current = ref<ProjectDetail | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── 查：列表 ──
  async function fetchProjects(search?: string, p?: number, ps?: number) {
    loading.value = true
    error.value = null
    try {
      const res = await getProjects({
        search,
        page: p ?? page.value,
        pageSize: ps ?? pageSize.value,
      })
      projects.value = res.items
      total.value = res.total
      page.value = res.page
      pageSize.value = res.pageSize
    } catch (e: any) {
      error.value = e?.message ?? '加载项目列表失败'
    } finally {
      loading.value = false
    }
  }

  // ── 查：详情 ──
  async function fetchProject(id: string) {
    loading.value = true
    error.value = null
    try {
      current.value = await getProject(id)
    } catch (e: any) {
      error.value = e?.message ?? '加载项目详情失败'
    } finally {
      loading.value = false
    }
  }

  // ── 增 ──
  async function create(form: CreateProjectForm) {
    loading.value = true
    error.value = null
    try {
      const created = await createProject(form)
      // 刷新列表
      await fetchProjects()
      return created
    } catch (e: any) {
      error.value = e?.message ?? '创建项目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── 删 ──
  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteProject(id)
      projects.value = projects.value.filter((p) => p.id !== id)
      total.value = Math.max(0, total.value - 1)
    } catch (e: any) {
      error.value = e?.message ?? '删除项目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── 改 ──
  async function update(id: string, form: UpdateProjectForm) {
    loading.value = true
    error.value = null
    try {
      const updated = await updateProject(id, form)
      const idx = projects.value.findIndex((p) => p.id === id)
      if (idx !== -1) projects.value[idx] = updated
      if (current.value?.id === id) {
        Object.assign(current.value, updated)
      }
      return updated
    } catch (e: any) {
      error.value = e?.message ?? '更新项目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── 同步查 ──
  function getById(id: string): ProjectItem | undefined {
    return projects.value.find((p) => p.id === id)
  }

  return {
    projects,
    current,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchProjects,
    fetchProject,
    create,
    remove,
    update,
    getById,
  }
})
