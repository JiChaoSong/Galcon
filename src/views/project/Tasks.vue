<script setup lang="ts">
import { ref, reactive, computed, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, theme, Modal } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { Plus, Copy, Pencil, Trash2, CirclePlay } from '@lucide/vue'
import { useTaskStore } from '@/stores/task'
import { useQuestionStore } from '@/stores/question'
import { useBrandStore } from '@/stores/brand'
import type { TaskBatch } from '@/stores/task'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string
const store = useTaskStore()
const questionStore = useQuestionStore()
const brandStore = useBrandStore()
const { token: t } = theme.useToken()

// ── 初始化 ──
onMounted(async () => {
  await Promise.all([
    store.fetchBatches(projectId),
    questionStore.fetchQuestions(projectId),
    brandStore.fetchBrands(projectId),
  ])
})

// ── 过滤 ──
const filterPlatform = ref('')
const filterBrand = ref('')

const batches = computed(() => {
  let list = store.batches
  if (filterPlatform.value) list = list.filter((b) => b.platformId === filterPlatform.value)
  if (filterBrand.value) list = list.filter((b) => b.brandId === filterBrand.value)
  return list
})

// ── 平台/品牌选项 ──
const platformOpts = computed(() => {
  const m = new Map<string, string>()
  store.batches.forEach(b => m.set(b.platformId, b.platformName))
  return Array.from(m).map(([v, l]) => ({ value: v, label: l }))
})
const brandOpts = computed(() => {
  const m = new Map<string, string>()
  store.batches.forEach(b => m.set(b.brandId, b.brandName))
  return Array.from(m).map(([v, l]) => ({ value: v, label: l }))
})

// ── 进度 ──
function batchProgress(batchId: string) {
  const items = store.getBatchItems(batchId)
  if (!items.length) return { done: 0, total: 0, pct: 0 }
  const done = items.filter(i => i.status === 'done' || i.status === 'review').length
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) }
}

// ── 新建/编辑 Drawer ──
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref()
const form = reactive({ name: '', platformId: 'deepseek', platformName: 'DeepSeek', brandId: '', brandName: '', assignedTo: '' })
const selectedQuestionIds = ref<string[]>([])

const platformOptions = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'doubao', label: '豆包' },
  { value: 'tongyi', label: '通义千问' },
  { value: 'chatgpt', label: 'ChatGPT' },
]
const brandOptions = computed(() =>
  brandStore.brands.map((b) => ({ value: b.id, label: b.name })),
)

const availableQuestions = computed(() =>
  questionStore.questions.filter((q) => q.status === 'enabled'),
)

const submittingForm = ref(false)

function resetForm() {
  form.name = ''
  form.platformId = 'deepseek'
  form.platformName = 'DeepSeek'
  form.brandId = brandOptions.value[0]?.value ?? ''
  form.brandName = brandOptions.value[0]?.label ?? ''
  form.assignedTo = ''
  selectedQuestionIds.value = []
}

function openCreate() {
  editingId.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(batch: TaskBatch) {
  editingId.value = batch.id
  Object.assign(form, {
    name: batch.name, platformId: batch.platformId, platformName: batch.platformName,
    brandId: batch.brandId, brandName: batch.brandName, assignedTo: batch.assignedTo ?? '',
  })
  // 加载已有条目
  store.fetchItems(batch.id).then((items) => {
    selectedQuestionIds.value = items.map(i => i.questionId)
  })
  drawerOpen.value = true
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const plat = platformOptions.find(p => p.value === form.platformId)
  const brd = brandOptions.value.find(b => b.value === form.brandId)
  submittingForm.value = true

  try {
    if (editingId.value) {
      await store.updateBatch(editingId.value, {
        name: form.name,
        platformId: form.platformId,
        platformName: plat?.label ?? '',
        brandId: form.brandId,
        brandName: brd?.label ?? '',
        assignedTo: form.assignedTo,
      })
      // 同步问题：移除不选中的，添加新选中的
      const existing = store.getBatchItems(editingId.value)
      const existingQIds = new Set(existing.map(i => i.questionId))
      for (const item of existing) {
        if (!selectedQuestionIds.value.includes(item.questionId)) {
          await store.removeItem(item.id)
        }
      }
      for (const qid of selectedQuestionIds.value) {
        if (!existingQIds.has(qid)) {
          const q = questionStore.questions.find(q => q.id === qid)
          if (q) {
            await store.addItems(editingId.value, [{ questionId: q.id, questionText: q.text }])
          }
        }
      }
    } else {
      const items = selectedQuestionIds.value.map(qid => {
        const q = questionStore.questions.find(q => q.id === qid)
        return { questionId: qid, questionText: q?.text ?? '' }
      })
      await store.addBatch(projectId, {
        name: form.name,
        platformId: form.platformId,
        platformName: plat?.label ?? '',
        brandId: form.brandId,
        brandName: brd?.label ?? '',
        assignedTo: form.assignedTo,
        items,
      })
    }
    drawerOpen.value = false
    message.success(editingId.value ? '已更新' : '已创建')
  } catch (e: any) {
    message.error(e?.message ?? '操作失败')
  } finally {
    submittingForm.value = false
  }
}

// ── 执行 ──
function goExecute(batch: TaskBatch) {
  router.push({ name: 'TaskExecution', params: { id: projectId, batchId: batch.id } })
}

async function handleCopy(id: string) {
  try {
    await store.copyBatch(id)
    message.success('已复制')
  } catch (e: any) {
    message.error(e?.message ?? '复制失败')
  }
}

async function handleRemoveBatch(id: string) {
  try {
    await store.removeBatch(id)
    message.success('已删除')
  } catch (e: any) {
    message.error(e?.message ?? '删除失败')
  }
}

function confirmRemoveBatch(id: string) {
  Modal.confirm({
    title: '确认删除该任务？',
    content: '删除后不可恢复，关联的测试条目也会被删除。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => handleRemoveBatch(id),
  })
}

// ── 表格列 ──
const columns: TableColumnsType = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
  { title: '平台', dataIndex: 'platformName', key: 'platform', width: 100 },
  { title: '品牌', dataIndex: 'brandName', key: 'brand', width: 100 },
  { title: '进度', key: 'progress', width: 180 },
  { title: '负责人', dataIndex: 'assignedTo', key: 'assignedTo', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]
</script>

<template>
  <div class="tasks-page">
    <div class="page-header">
      <h2 :style="{ color: t.colorText }">测试任务</h2>
    </div>

    <div class="filter-bar">
      <a-select v-model:value="filterPlatform" placeholder="全部平台" allow-clear style="width: 140px">
        <a-select-option v-for="p in platformOpts" :key="p.value" :value="p.value">{{ p.label }}</a-select-option>
      </a-select>
      <a-select v-model:value="filterBrand" placeholder="全部品牌" allow-clear style="width: 140px">
        <a-select-option v-for="b in brandOpts" :key="b.value" :value="b.value">{{ b.label }}</a-select-option>
      </a-select>
      <div class="filter-bar-spacer" />
      <a-button type="primary" @click="openCreate" :icon="h(Plus, { size: 14 })">
        新建任务
      </a-button>
    </div>

    <a-card class="list-card" :style="{ borderColor: t.colorBorderSecondary }">
      <a-table
        :columns="columns"
        :data-source="batches"
        :loading="store.loading"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a style="font-weight: 500; cursor: pointer" @click="goExecute(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'progress'">
            <div class="progress-cell">
              <a-progress :percent="batchProgress(record.id).pct" :size="10" :show-info="false" style="flex: 1" />
              <span class="progress-text">{{ batchProgress(record.id).done }}/{{ batchProgress(record.id).total }}</span>
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-icons">
              <a-tooltip title="执行测试">
                <a-button type="text" size="small" @click="goExecute(record)" :icon="h(CirclePlay, { size: 14 })" />
              </a-tooltip>
              <a-tooltip title="编辑">
                <a-button type="text" size="small" @click="openEdit(record)" :icon="h(Pencil, { size: 14 })" />
              </a-tooltip>
              <a-tooltip title="复制">
                <a-button type="text" size="small" @click="handleCopy(record.id)" :icon="h(Copy, { size: 14 })" />
              </a-tooltip>
              <a-tooltip title="删除">
                <a-button type="text" size="small" danger :icon="h(Trash2, { size: 14 })" @click="confirmRemoveBatch(record.id)" />
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>

      <div class="table-footer">
        <div class="table-count">共 {{ batches.length }} 条</div>
      </div>
    </a-card>

    <!-- ═══ 新建/编辑 Drawer ═══ -->
    <a-drawer
      v-model:open="drawerOpen"
      :title="editingId ? '编辑任务' : '新建测试任务'"
      :width="520"
      placement="right"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="任务名称" name="name" :rules="[{ required: true, message: '请输入任务名称' }]">
          <a-input v-model:value="form.name" placeholder="如：CRM 品牌可见性测试-第1批" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="测试平台" name="platformId" :rules="[{ required: true }]">
              <a-select v-model:value="form.platformId" :options="platformOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="目标品牌" name="brandId" :rules="[{ required: true }]">
              <a-select v-model:value="form.brandId" :options="brandOptions" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="负责人" name="assignedTo" :rules="[{ required: true, message: '请输入负责人' }]">
          <a-input v-model:value="form.assignedTo" placeholder="如：李四" />
        </a-form-item>

        <a-divider />
        <div :style="{ color: t.colorTextSecondary, fontSize: '13px', marginBottom: '8px' }">
          选择测试问题（从问题库）
        </div>
        <a-checkbox-group v-model:value="selectedQuestionIds" style="width: 100%">
          <div class="question-check-list">
            <div v-for="q in availableQuestions" :key="q.id" class="question-check-item">
              <a-checkbox :value="q.id">
                <span :style="{ color: t.colorText }">{{ q.text }}</span>
                <a-tag size="small" style="margin-left: 6px">{{ q.type === 'competitor_compare' ? '竞品对比' : q.type === 'brand_perception' ? '品牌认知' : '通用' }}</a-tag>
              </a-checkbox>
            </div>
          </div>
        </a-checkbox-group>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px">
          <a-button @click="drawerOpen = false">取消</a-button>
          <a-button type="primary" :loading="submittingForm" @click="handleSubmit">{{ editingId ? '保存' : '创建' }}</a-button>
        </div>
      </a-form>
    </a-drawer>
  </div>
</template>

<style scoped>
.tasks-page { display: flex; flex-direction: column; gap: 16px; }

.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }

.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-bar-spacer { flex: 1; }

.list-card :deep(.ant-card-body) { padding: 0; }

.progress-cell { display: flex; align-items: center; gap: 8px; min-width: 130px; }
.progress-text { font-size: 12px; white-space: nowrap; }

.action-icons { display: flex; align-items: center; gap: 2px; }
.action-icons :deep(.ant-btn) { color: v-bind('t.colorTextTertiary'); }

.table-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 16px 16px;
}
.table-count { color: v-bind('t.colorTextSecondary'); font-size: 13px; }

.question-check-list {
  display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto;
}
.question-check-item {
  padding: 6px 8px; border-radius: 8px; transition: background 0.2s;
}
.question-check-item:hover { background: rgba(128, 128, 128, 0.08); }
</style>
