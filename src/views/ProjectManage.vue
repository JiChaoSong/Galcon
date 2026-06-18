<script setup lang="ts">
import { ref, computed, h, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, theme, Modal } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { LayoutList, LayoutGrid, MoreHorizontal, Eye, Edit, Trash2, Plus, Search } from '@lucide/vue'
import { useProjectStore } from '@/stores/project'
import { useBrandStore } from '@/stores/brand'
import { useAppStore } from '@/stores/app'
import type { ProjectItem as Project } from '@/api/project'
import type { CreateProjectForm } from '@/api/project'

// ── store & token ──
const router = useRouter()
const store = useProjectStore()
const brandStore = useBrandStore()
const appStore = useAppStore()
const { token: t } = theme.useToken()

// ── 枚举映射 ──
const typeOptions = [
  { label: '样板报告', value: 'sample' },
  { label: '客户诊断', value: 'client' },
  { label: '月度复测', value: 'monthly' },
]
const typeMap: Record<string, string> = Object.fromEntries(typeOptions.map((o) => [o.value, o.label]))

const statusOptions = [
  { label: '准备中', value: 'preparing', color: 'default' },
  { label: '测试中', value: 'testing', color: 'processing' },
  { label: '分析中', value: 'analyzing', color: 'warning' },
  { label: '已完成', value: 'completed', color: 'success' },
]
const statusMap: Record<string, { label: string; color: string }> = Object.fromEntries(
  statusOptions.map((o) => [o.value, { label: o.label, color: o.color }]),
)

// ── 视图 & 搜索 ──
const viewMode = computed({
  get: () => appStore.projectViewMode,
  set: (val) => { appStore.projectViewMode = val },
})
const searchKeyword = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchChange() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.fetchProjects(searchKeyword.value || undefined)
  }, 300)
}

const filteredProjects = computed(() => store.projects)

// ── 初始加载 ──
onMounted(() => {
  store.fetchProjects()
})

// ── 抽屉 & 表单 ──
const drawerOpen = ref(false)
const drawerTitle = ref('新建项目')
const editingId = ref<string | null>(null)
const formRef = ref()
const form = reactive<CreateProjectForm>(emptyForm())
const submitting = ref(false)

function emptyForm(): CreateProjectForm {
  return {
    name: '',
    industry: '',
    type: 'client',
    status: 'preparing',
    owner: '',
    taskTotal: 100,
    description: '',
    brandName: '',
    brandWebsite: '',
    brandIntro: '',
  }
}

function goToProject(project: Project) {
  router.push({ name: 'ProjectBrands', params: { id: project.id } })
}

function openCreate() {
  editingId.value = null
  drawerTitle.value = '新建项目'
  Object.assign(form, emptyForm())
  drawerOpen.value = true
}

function openEdit(project: Project) {
  editingId.value = project.id
  drawerTitle.value = '编辑项目'
  // 加载品牌列表以获取当前品牌名
  brandStore.fetchBrands(project.id).then(() => {
    const b = brandStore.brands[0]
    form.brandName = b?.name ?? ''
    form.brandWebsite = b?.website ?? ''
    form.brandIntro = b?.intro ?? ''
  })
  Object.assign(form, {
    name: project.name,
    industry: project.industry,
    type: project.type,
    status: project.status,
    owner: project.owner,
    taskTotal: project.taskTotal,
    description: project.description ?? '',
    brandName: '',
    brandWebsite: '',
    brandIntro: '',
  })
  drawerOpen.value = true
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, { ...form, brandName: undefined, brandWebsite: undefined, brandIntro: undefined })
      // 同步更新品牌
      const firstBrand = brandStore.brands[0]
      if (firstBrand) {
        const bUpdate: Record<string, string> = {}
        if (form.brandName && form.brandName !== firstBrand.name) bUpdate.name = form.brandName
        if ((form.brandWebsite ?? '') !== (firstBrand.website ?? '')) bUpdate.website = form.brandWebsite ?? ''
        if ((form.brandIntro ?? '') !== (firstBrand.intro ?? '')) bUpdate.intro = form.brandIntro ?? ''
        if (Object.keys(bUpdate).length > 0) {
          await brandStore.updateBrand(editingId.value, firstBrand.id, bUpdate as any)
        }
      }
      message.success('已更新')
    } else {
      await store.create({ ...form })
      message.success('已创建')
    }
    drawerOpen.value = false
    formRef.value?.resetFields()
  } catch (e: any) {
    message.error(e?.message ?? '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await store.remove(id)
    message.success('已删除')
  } catch (e: any) {
    message.error(e?.message ?? '删除失败')
  }
}

function confirmDelete(id: string) {
  Modal.confirm({
    title: '确认删除该项目？',
    content: '删除后不可恢复。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => handleDelete(id),
  })
}

// ── 表格列 ──
const columns: TableColumnsType = [
  { title: '项目名称', dataIndex: 'name', key: 'name', width: 260, ellipsis: true },
  { title: '行业', dataIndex: 'industry', key: 'industry', width: 140 },
  {
    title: '类型', dataIndex: 'type', key: 'type', width: 100,
    customRender: ({ text }: { text: string }) => typeMap[text] ?? text,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '测试进度', key: 'progress', width: 180 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 80 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

// ── 样式 ──
const cardBg = computed(() => t.value.colorBgContainer)
</script>

<template>
  <div class="project-manage">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <h2 class="page-title" :style="{ color: t.colorText }">项目管理</h2>
      <div class="page-actions">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索名称、行业、负责人"
          style="width: 280px"
          @change="onSearchChange"
        >
          <template #prefix><Search :size="14" /></template>
        </a-input-search>
        <a-segmented
          v-model:value="viewMode"
          :options="[
            { value: 'list', icon: h(LayoutList) },
            { value: 'card', icon: h(LayoutGrid) },
          ]"
        />
        <a-button type="primary" @click="openCreate" :icon="h(Plus, { size: 14 })">
          新建项目
        </a-button>
      </div>
    </div>

    <!-- ═══ 列表视图 ═══ -->
    <div v-if="viewMode === 'list'" class="list-view" :style="{ background: cardBg }">
      <a-table
        :columns="columns"
        :data-source="filteredProjects"
        :loading="store.loading"
        :pagination="{ current: store.page, pageSize: store.pageSize, total: store.total, showTotal: (total: number) => `共 ${total} 个项目`, onChange: (p: number, ps: number) => store.fetchProjects(searchKeyword || undefined, p, ps) }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a style="font-weight: 500; cursor: pointer" @click="goToProject(record)">
              {{ record.name }}
            </a>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusMap[record.status]?.color">
              {{ statusMap[record.status]?.label }}
            </a-tag>
          </template>
          <template v-if="column.key === 'progress'">
            <div class="progress-cell">
              <a-progress
                :percent="record.taskTotal ? Math.round((record.taskDone / record.taskTotal) * 100) : 0"
                :size="10"
                :show-info="false"
                style="flex: 1"
              />
              <span class="progress-text">{{ record.taskDone }}/{{ record.taskTotal }}</span>
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small">
                <MoreHorizontal :size="16" />
              </a-button>
              <template #overlay>
                <a-menu @click="({ key }: { key: string }) => {
                  if (key === 'edit') openEdit(record)
                  if (key === 'view') goToProject(record)
                }">
                  <a-menu-item key="view"><Eye :size="14" class="menu-icon" />查看</a-menu-item>
                  <a-menu-item key="edit"><Edit :size="14" class="menu-icon" />编辑</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger @click="confirmDelete(record.id)">
                    <Trash2 :size="14" class="menu-icon" />删除
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>
    </div>

    <!-- ═══ 空状态 ═══ -->
    <a-empty
      v-if="!store.loading && filteredProjects.length === 0"
      description="暂无项目，点击右上角「新建项目」开始"
    />

    <!-- ═══ 卡片视图 ═══ -->
    <div v-else class="card-view">
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="project in filteredProjects"
          :key="project.id"
          :xs="24" :sm="12" :lg="8" :xl="6"
        >
          <a-card
            hoverable
            :style="{ background: cardBg, borderRadius: t.borderRadiusLG }"
            :body-style="{ padding: '16px 16px 12px' }"
            @click="goToProject(project)"
          >
            <div class="card-info">
              <div class="card-top-row">
                <a-tag :color="statusMap[project.status]?.color">
                  {{ statusMap[project.status]?.label }}
                </a-tag>
                <a-dropdown :trigger="['click']">
                  <a-button type="text" size="small" class="card-more" @click.stop>
                    <MoreHorizontal :size="16" />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="({ key }: { key: string }) => {
                      if (key === 'view') goToProject(project)
                      if (key === 'edit') openEdit(project)
                    }">
                      <a-menu-item key="view"><Eye :size="14" class="menu-icon" />查看</a-menu-item>
                      <a-menu-item key="edit"><Edit :size="14" class="menu-icon" />编辑</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger @click="confirmDelete(project.id)"><Trash2 :size="14" class="menu-icon" />删除</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>

              <a-tooltip :title="project.name">
                <h3 class="card-title" :style="{ color: t.colorText }">{{ project.name }}</h3>
              </a-tooltip>

              <div class="card-tags">
                <a-tag color="blue" class="tag-ellipsis" :title="project.industry">{{ project.industry }}</a-tag>
                <a-tag>{{ typeMap[project.type] ?? project.type }}</a-tag>
              </div>

              <div class="card-meta-row" :style="{ color: t.colorTextTertiary }">
                <span>{{ project.owner }}</span>
                <span>{{ project.updatedAt.slice(0, 10) }}</span>
              </div>

              <a-progress
                :percent="project.taskTotal ? Math.round((project.taskDone / project.taskTotal) * 100) : 0"
                :show-info="false"
                :size="6"
                style="margin-top: 10px"
              />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- ═══ 新增/编辑抽屉 ═══ -->
    <a-drawer
      v-model:open="drawerOpen"
      :title="drawerTitle"
      :width="480"
      placement="right"
      :body-style="{ paddingBottom: '80px' }"
    >
      <a-form ref="formRef" :model="form" layout="vertical" :label-col="{ span: 0 }">
        <a-form-item
          label="项目名称"
          name="name"
          :rules="[{ required: true, message: '请输入项目名称' }]"
        >
          <a-input v-model:value="form.name" placeholder="如：CRM 行业 AI 可见性样板报告" />
        </a-form-item>

        <a-form-item
          label="项目类型"
          name="type"
          :rules="[{ required: true, message: '请选择项目类型' }]"
        >
          <a-select v-model:value="form.type" :options="typeOptions" />
        </a-form-item>

        <a-form-item
          label="行业"
          name="industry"
          :rules="[{ required: true, message: '请输入行业' }]"
        >
          <a-input v-model:value="form.industry" placeholder="如：CRM / B2B SaaS" />
        </a-form-item>

        <a-form-item
          label="品牌名称"
          name="brandName"
        >
          <a-input v-model:value="form.brandName" placeholder="如：纷享销客" />
        </a-form-item>

        <a-form-item label="品牌官网" name="brandWebsite">
          <a-input v-model:value="form.brandWebsite" placeholder="如：https://www.fxiaoke.com" />
        </a-form-item>

        <a-form-item label="品牌介绍" name="brandIntro">
          <a-textarea v-model:value="form.brandIntro" :rows="2" placeholder="一句话介绍品牌" />
        </a-form-item>

        <a-form-item label="项目状态" name="status">
          <a-select v-model:value="form.status" :options="statusOptions.map(s => ({ label: s.label, value: s.value }))" />
        </a-form-item>

        <a-form-item
          label="负责人"
          name="owner"
          :rules="[{ required: true, message: '请输入负责人' }]"
        >
          <a-input v-model:value="form.owner" placeholder="如：张三" />
        </a-form-item>

        <a-form-item label="预估任务数" name="taskTotal">
          <a-input-number v-model:value="form.taskTotal" :min="1" :max="1000" style="width: 100%" />
        </a-form-item>

        <a-form-item label="项目说明" name="description">
          <a-textarea
            v-model:value="form.description"
            :rows="3"
            placeholder="简要描述项目目标、测试范围等"
          />
        </a-form-item>

        <div style="display: flex; gap: 12px; justify-content: flex-end">
          <a-button @click="drawerOpen = false">取消</a-button>
          <a-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ editingId ? '保存' : '创建' }}
          </a-button>
        </div>
      </a-form>
    </a-drawer>
  </div>
</template>

<style scoped>
.project-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 顶栏 ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── 列表 ── */
.list-view {
  border-radius: 8px;
  padding: 16px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

.progress-text {
  font-size: 12px;
  white-space: nowrap;
}

/* ── 卡片 ── */
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-more { margin-left: auto; }

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.tag-ellipsis {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.card-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

/* ── 通用 ── */
.menu-icon {
  margin-right: 6px;
  vertical-align: -2px;
}
</style>
