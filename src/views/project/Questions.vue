<script setup lang="ts">
import { computed, h, reactive, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import * as XLSX from 'xlsx'
import importIcon from '@/assets/import_question_upload_icon.svg'
import {
  ArrowLeft,
  ArrowRight,
  CloudUpload,
  ChevronDown,
  CircleArrowRight,
  Download,
  Eye,
  HeartHandshake,
  FileSpreadsheet,
  Import,
  Info,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Tags,
  Trash2,
  X,
} from '@lucide/vue'
import { useQuestionStore, questionTypeMap } from '@/stores/question'
import { useTaskStore } from '@/stores/task'
import { useBrandStore } from '@/stores/brand'
import type { Question } from '@/stores/question'
import { useTokenMeta } from '@/composables/useTokenMeta'
import { softTagStyle } from '@/composables/useTagStyle'

type QuestionType = Question['type']
type QuestionStatus = Question['status']

interface QuestionRow {
  id: string
  displayId: string
  text: string
  type: QuestionType
  intent: string
  industry: string
  status: QuestionStatus
  updatedAt: string
  difficulty: Question['difficulty']
  analysisPhase: string
  testBatch: string
}

interface TypeSummary {
  key: 'all' | QuestionType
  label: string
  icon: unknown
  color: string
  count: number
}

const t = useTokenMeta()
const route = useRoute()
const questionStore = useQuestionStore()
const taskStore = useTaskStore()
const brandStore = useBrandStore()
const projectId = route.params.id as string

// ── 加载数据 ──
onMounted(() => {
  questionStore.fetchQuestions(projectId)
  brandStore.fetchBrands(projectId)
})

// ── 将 store 数据转为展示行 ──
const allRows = computed<QuestionRow[]>(() =>
  questionStore.questions.map((q) => ({
    id: q.id,
    displayId: `Q-${q.id.slice(0, 6).toUpperCase()}`,
    text: q.text,
    type: q.type,
    intent: q.intent ?? '',
    industry: q.industry ?? '',
    status: q.status,
    updatedAt: q.updatedAt?.slice(0, 16).replace('T', ' ') ?? '',
    difficulty: q.difficulty,
    analysisPhase: q.analysisPhase ?? '',
    testBatch: q.testBatch ?? '',
  })),
)

const totalQuestions = computed(() => allRows.value.length)

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref()
const selectedType = ref<TypeSummary['key']>('all')
const searchKeyword = ref('')
const industryFilter = ref('')
const intentFilter = ref('')
const statusFilter = ref('')
const analysisPhaseFilter = ref('')
const testBatchFilter = ref('')
const selectedRowKeys = ref<string[]>([])
const allSelected = ref(false)

const currentPageIds = computed(() => pagedRows.value.map((r) => r.id))
const allFilteredIds = computed(() => filteredRows.value.map((r) => r.id))
const currentPageAllChecked = computed(() =>
  currentPageIds.value.length > 0 && currentPageIds.value.every((id) => selectedRowKeys.value.includes(id)),
)
const currentPage = ref(1)
const pageSize = ref(20)

// 筛选变化时重置页码
watch([selectedType, searchKeyword, industryFilter, intentFilter, statusFilter, analysisPhaseFilter, testBatchFilter], () => {
  currentPage.value = 1
  allSelected.value = false
  selectedRowKeys.value = []
})

const form = reactive({
  text: '',
  industry: '',
  type: 'category_recommend' as QuestionType,
  intent: '',
  difficulty: 'basic' as Question['difficulty'],
})

const typeMeta = computed(() => {
  const c = t.value
  return {
    category_recommend: { label: '品牌推荐', icon: Sparkles, color: c.colorQuestionCategory },
    competitor_compare: { label: '竞品对比', icon: CircleArrowRight, color: c.colorQuestionCompetitor },
    scenario_solve: { label: '场景解决', icon: Lightbulb, color: c.colorQuestionScenario },
    purchase_decision: { label: '采购决策', icon: ShoppingCart, color: c.colorQuestionPurchase },
    alternative: { label: '替代方案', icon: Tags, color: c.colorQuestionAlternative },
    brand_perception: { label: '品牌认知', icon: HeartHandshake, color: c.colorQuestionBrand },
    risk_reputation: { label: '风险口碑', icon: ShieldAlert, color: c.colorQuestionRisk },
  } as Record<QuestionType, { label: string; icon: unknown; color: string }>
})

const typeSummaries = computed<TypeSummary[]>(() => {
  const items = allRows.value
  const counts: Record<string, number> = {}
  for (const row of items) {
    counts[row.type] = (counts[row.type] ?? 0) + 1
  }
  return [
    { key: 'all', label: '全部', icon: Sparkles, color: t.value.colorPrimary, count: items.length },
    { key: 'category_recommend', label: '品牌推荐', icon: Sparkles, color: t.value.colorQuestionCategory, count: counts['category_recommend'] ?? 0 },
    { key: 'competitor_compare', label: '竞品对比', icon: CircleArrowRight, color: t.value.colorQuestionCompetitor, count: counts['competitor_compare'] ?? 0 },
    { key: 'scenario_solve', label: '场景解决', icon: Lightbulb, color: t.value.colorQuestionScenario, count: counts['scenario_solve'] ?? 0 },
    { key: 'purchase_decision', label: '采购决策', icon: ShoppingCart, color: t.value.colorQuestionPurchase, count: counts['purchase_decision'] ?? 0 },
    { key: 'alternative', label: '替代方案', icon: Tags, color: t.value.colorQuestionAlternative, count: counts['alternative'] ?? 0 },
    { key: 'brand_perception', label: '品牌认知', icon: HeartHandshake, color: t.value.colorQuestionBrand, count: counts['brand_perception'] ?? 0 },
    { key: 'risk_reputation', label: '风险口碑', icon: ShieldAlert, color: t.value.colorQuestionRisk, count: counts['risk_reputation'] ?? 0 },
  ]
})

const filteredRows = computed(() => {
  let list = allRows.value

  if (selectedType.value !== 'all') {
    list = list.filter((row) => row.type === selectedType.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    list = list.filter(
      (row) =>
        row.text.toLowerCase().includes(keyword) ||
        row.intent.toLowerCase().includes(keyword) ||
        row.displayId.toLowerCase().includes(keyword),
    )
  }

  if (industryFilter.value) {
    list = list.filter((row) => row.industry === industryFilter.value)
  }

  if (intentFilter.value) {
    list = list.filter((row) => row.intent === intentFilter.value)
  }

  if (statusFilter.value) {
    list = list.filter((row) => row.status === statusFilter.value)
  }

  if (analysisPhaseFilter.value) {
    list = list.filter((row) => row.analysisPhase === analysisPhaseFilter.value)
  }

  if (testBatchFilter.value) {
    list = list.filter((row) => row.testBatch === testBatchFilter.value)
  }

  return list
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const industryOptions = computed(() => [
  { value: '', label: '全部行业' },
  ...Array.from(new Set(allRows.value.map((row) => row.industry))).map((value) => ({ value, label: value })),
])

const intentOptions = computed(() => [
  { value: '', label: '全部意图' },
  ...Array.from(new Set(allRows.value.map((row) => row.intent))).map((value) => ({ value, label: value })),
])

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'enabled', label: '已发布' },
  { value: 'pending', label: '审核中' },
  { value: 'deprecated', label: '草稿' },
]

const analysisPhaseOptions = computed(() => [
  { value: '', label: '全部分析阶段' },
  ...Array.from(new Set(allRows.value.map((row) => row.analysisPhase).filter(Boolean))).map((value) => ({ value, label: value })),
])

const testBatchOptions = computed(() => [
  { value: '', label: '全部测试批次' },
  ...Array.from(new Set(allRows.value.map((row) => row.testBatch).filter(Boolean))).map((value) => ({ value, label: value })),
])

const selectedCount = computed(() => selectedRowKeys.value.length)

const rowSelection = computed(() => ({
  selectedRowKeys: allSelected.value ? allFilteredIds.value : selectedRowKeys.value,
  onChange: (keys: string[]) => {
    // 手动取消勾选时退出全选模式
    if (allSelected.value && keys.length < allFilteredIds.value.length) {
      allSelected.value = false
      selectedRowKeys.value = keys
    } else {
      selectedRowKeys.value = keys
    }
  },
}))

function selectAllFiltered() {
  allSelected.value = true
  selectedRowKeys.value = allFilteredIds.value
}

const submitting = ref(false)

function openCreate() {
  editingId.value = null
  Object.assign(form, { text: '', industry: '', type: 'category_recommend', intent: '', difficulty: 'basic' })
  drawerOpen.value = true
}

function openEdit(row: QuestionRow) {
  editingId.value = row.id
  Object.assign(form, {
    text: row.text,
    industry: row.industry,
    type: row.type,
    intent: row.intent,
    difficulty: row.difficulty,
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
    if (!editingId.value) {
      await questionStore.addQuestion(projectId, {
        text: form.text,
        type: form.type,
        intent: form.intent || undefined,
        industry: form.industry || undefined,
        difficulty: form.difficulty,
        status: 'enabled',
        isGeneral: false,
        createdByAI: false,
      })
      message.success('问题已新增')
    } else {
      await questionStore.updateQuestion(projectId, editingId.value, {
        text: form.text,
        industry: form.industry,
        type: form.type,
        intent: form.intent,
        difficulty: form.difficulty,
      })
      message.success('问题已更新')
    }
    drawerOpen.value = false
  } catch (e: any) {
    message.error(e?.message ?? '操作失败')
  } finally {
    submitting.value = false
  }
}

function resetFilters() {
  searchKeyword.value = ''
  industryFilter.value = ''
  intentFilter.value = ''
  statusFilter.value = ''
  analysisPhaseFilter.value = ''
  testBatchFilter.value = ''
  selectedType.value = 'all'
  allSelected.value = false
  selectedRowKeys.value = []
}

async function handleDeleteOne(id: string) {
  try {
    await questionStore.removeQuestion(projectId, id)
    message.success('已删除')
  } catch (e: any) {
    message.error(e?.message ?? '删除失败')
  }
}

function confirmDeleteOne(id: string) {
  Modal.confirm({
    title: '确认删除该问题？',
    content: '删除后不可恢复，关联的测试条目也会被清除。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => handleDeleteOne(id),
  })
}

// ── 生成测试任务 ──
const batchDrawerOpen = ref(false)
const batchForm = reactive({ name: '', platformId: 'deepseek', platformName: 'DeepSeek', brandId: '', brandName: '', assignedTo: '' })
const batchSubmitting = ref(false)

const platformOptions = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'doubao', label: '豆包' },
  { value: 'tongyi', label: '通义千问' },
  { value: 'chatgpt', label: 'ChatGPT' },
]
const brandOpts = computed(() =>
  brandStore.brands.map((b) => ({ value: b.id, label: b.name })),
)

// 同步名称
watch(() => batchForm.platformId, (val) => {
  const p = platformOptions.find(p => p.value === val)
  if (p) batchForm.platformName = p.label
})
watch(() => batchForm.brandId, (val) => {
  const b = brandOpts.value.find(b => b.value === val)
  if (b) batchForm.brandName = b.label
})

function handleGenerateTasks() {
  if (selectedCount.value === 0) { message.warning('请先选择问题'); return }
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
  batchForm.name = `批量测试任务-${ts}`
  batchForm.platformId = 'deepseek'
  batchForm.platformName = 'DeepSeek'
  batchForm.brandId = brandOpts.value[0]?.value ?? ''
  batchForm.brandName = brandOpts.value[0]?.label ?? ''
  batchForm.assignedTo = ''
  batchDrawerOpen.value = true
}

async function handleBatchSubmit() {
  if (!batchForm.name.trim()) { message.warning('请输入任务名称'); return }
  batchSubmitting.value = true
  try {
    const plat = platformOptions.find(p => p.value === batchForm.platformId)
    const brd = brandOpts.value.find(b => b.value === batchForm.brandId)
    const items = selectedRowKeys.value.map(qid => {
      const q = questionStore.questions.find(q => q.id === qid)
      return { questionId: qid, questionText: q?.text ?? '' }
    })
    await taskStore.addBatch(projectId, {
      name: batchForm.name,
      platformId: batchForm.platformId,
      platformName: plat?.label ?? '',
      brandId: batchForm.brandId,
      brandName: brd?.label ?? '',
      assignedTo: batchForm.assignedTo,
      items,
    })
    message.success(`已创建测试任务，包含 ${items.length} 个问题`)
    batchDrawerOpen.value = false
    selectedRowKeys.value = []
  } catch (e: any) {
    message.error(e?.message ?? '创建失败')
  } finally {
    batchSubmitting.value = false
  }
}

function handleBatchDelete() {
  if (selectedCount.value === 0) return
  Modal.confirm({
    title: `确认删除 ${selectedCount.value} 个问题？`,
    content: '删除后不可恢复，关联的测试条目也会被清除。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      let fail = 0
      for (const id of selectedRowKeys.value) {
        try { await questionStore.removeQuestion(projectId, id) } catch { fail++ }
      }
      message.success(`已删除 ${selectedCount.value - fail} 个问题${fail > 0 ? `，${fail} 个失败` : ''}`)
      selectedRowKeys.value = []
    },
  })
}

function handleImport() {
  resetImportState()
  importModalOpen.value = true
}

function handleAIGenerate() {
  message.info('AI 生成问题功能开发中')
}

// ── 导入功能 ──
interface ParsedQuestion {
  text: string
  type: string
  intent: string
  industry: string
  difficulty: string
  sortOrder?: number
  analysisOrder?: number
  analysisPhase?: string
  globalTestOrder?: number
  testBatch?: string
}

interface ImportResultState {
  total: number
  success: number
  fail: number
}

const importModalOpen = ref(false)
const importFile = ref<File | null>(null)
const importPreviewRows = ref<ParsedQuestion[]>([])
const importLoading = ref(false)
const importStep = ref(0)
const importResult = reactive<ImportResultState>({
  total: 0,
  success: 0,
  fail: 0,
})

const importSteps = [
  { title: '上传文件', description: '下载模板并上传填写好的文件' },
  { title: '导入预览', description: '确认解析后的数据内容' },
  { title: '导入结果', description: '查看导入成功与失败结果' },
]
const draggingImport = ref(false)
const importPreviewVisibleRows = computed(() => importPreviewRows.value.slice(0, 20))

function resetImportState() {
  importFile.value = null
  importPreviewRows.value = []
  importLoading.value = false
  importStep.value = 0
  draggingImport.value = false
  importResult.total = 0
  importResult.success = 0
  importResult.fail = 0
}

function goNextImportStep() {
  if (importStep.value === 0) {
    if (!importFile.value || importPreviewRows.value.length === 0) {
      message.warning('请先上传并解析文件')
      return
    }
    importStep.value = 1
  }
}

function goPrevImportStep() {
  if (importStep.value > 0) {
    importStep.value -= 1
  }
}

function restartImportFlow() {
  importFile.value = null
  importPreviewRows.value = []
  draggingImport.value = false
  importStep.value = 0
  importResult.total = 0
  importResult.success = 0
  importResult.fail = 0
}

const typeLabelToValue: Record<string, string> = {
  '品类推荐': 'category_recommend', '品牌推荐': 'category_recommend',
  '竞品对比': 'competitor_compare',
  '场景解决': 'scenario_solve',
  '采购决策': 'purchase_decision',
  '替代方案': 'alternative',
  '品牌认知': 'brand_perception',
  '风险口碑': 'risk_reputation',
}

function downloadCsvTemplate() {
  const BOM = '\uFEFF'
  const header = '问题内容,问题类型,用户意图,行业,难度'
  const examples = [
    '国内最好的 CRM 软件有哪些？,品类推荐,寻找主流产品,CRM,基础',
    '纷享销客和销售易哪个更好？,竞品对比,对比选型,CRM,中等',
  ]
  const csv = BOM + header + '\n' + examples.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '问题导入模板.csv'; a.click()
  URL.revokeObjectURL(url)
}

function downloadExcelTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['问题内容', '问题类型', '用户意图', '行业', '难度'],
    ['国内最好的 CRM 软件有哪些？', '品类推荐', '寻找主流产品', 'CRM', '基础'],
    ['纷享销客和销售易哪个更好？', '竞品对比', '对比选型', 'CRM', '中等'],
  ])
  ws['!cols'] = [{ wch: 45 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '问题导入模板')
  XLSX.writeFile(wb, '问题导入模板.xlsx')
}

function onBeforeUpload(file: File) {
  importFile.value = file
  parseFile(file)
  return false
}

function parseFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
      const header = rows[0]
      const isNewFormat = header && header.length >= 10 && header[0] === 'question_id'

      const parsed: ParsedQuestion[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.every((c) => !c)) continue

        if (isNewFormat) {
          // 问题顺序配置 格式: question_id,导入顺序,分析顺序,分析阶段,问题类型,用户意图,行业,难度,全局测试顺序,测试批次,测试分组,问题内容,原始生成顺序
          const text = (row[11] ?? '').trim()
          if (!text) continue
          parsed.push({
            text,
            type: row[4]?.trim() ?? '',
            intent: row[5]?.trim() ?? '',
            industry: row[6]?.trim() ?? '',
            difficulty: row[7]?.trim() ?? '',
            sortOrder: parseInt(row[1]) || 0,
            analysisOrder: parseInt(row[2]) || 0,
            analysisPhase: row[3]?.trim() ?? '',
            globalTestOrder: parseInt(row[8]) || 0,
            testBatch: row[9]?.trim() ?? '',
          })
        } else {
          // 旧格式: 问题内容,问题类型,用户意图,行业,难度
          const text = (row[0] ?? '').trim()
          if (!text) continue
          parsed.push({
            text,
            type: row[1]?.trim() ?? '',
            intent: row[2]?.trim() ?? '',
            industry: row[3]?.trim() ?? '',
            difficulty: row[4]?.trim() ?? '',
          })
        }
      }
      importPreviewRows.value = parsed
      if (parsed.length > 0) {
        importStep.value = 1
      } else {
        message.warning('文件中未解析到有效数据')
      }
    } catch (err: any) {
      message.error('文件解析失败: ' + (err?.message ?? '未知错误'))
    }
  }
  reader.readAsArrayBuffer(file)
}

async function confirmImport() {
  if (importPreviewRows.value.length === 0) { message.warning('无可导入的数据'); return }
  importLoading.value = true
  let success = 0; let fail = 0
  try {
    for (const row of importPreviewRows.value) {
      try {
        await questionStore.addQuestion(projectId, {
          text: row.text,
          type: typeLabelToValue[row.type] ?? row.type ?? 'category_recommend',
          industry: row.industry || undefined,
          intent: row.intent || undefined,
          difficulty: (['基础', '中等', '深度'].includes(row.difficulty) ? { '基础': 'basic', '中等': 'medium', '深度': 'deep' }[row.difficulty] : 'basic') as 'basic' | 'medium' | 'deep',
          sortOrder: row.sortOrder,
          analysisOrder: row.analysisOrder,
          analysisPhase: row.analysisPhase || undefined,
          globalTestOrder: row.globalTestOrder,
          testBatch: row.testBatch || undefined,
          isGeneral: false,
          createdByAI: false,
          status: 'enabled',
        })
        success++
      } catch {
        fail++
      }
    }
    importResult.total = importPreviewRows.value.length
    importResult.success = success
    importResult.fail = fail
    importStep.value = 2
    message.success(`导入完成：成功 ${success} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`)
  } finally {
    importLoading.value = false
  }
}

function closeImportModal() {
  importModalOpen.value = false
  resetImportState()
}

function typeTagStyle(type: QuestionType) {
  return softTagStyle(typeMeta.value[type].color)
}

function statusTagColor(status: QuestionStatus) {
  if (status === 'enabled') return 'success'
  if (status === 'pending') return 'warning'
  return undefined
}
</script>

<template>
  <div class="questions-page">
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :xl="24">
        <div class="left-panel">
          <div class="page-header">
            <h2 :style="{ color: t.colorText }">问题库</h2>
            <div class="page-description" :style="{ color: t.colorTextSecondary }">
              <Info :size="14" />
              <p>沉淀与管理评测问题，支持筛选、编辑与批量管理，助力构建高质量评测体系。</p>
            </div>
          </div>

          <a-card class="type-summary-card" :style="{ borderColor: t.colorBorderSecondary }">
            <div class="type-summary-list">
              <button
                v-for="item in typeSummaries"
                :key="item.key"
                type="button"
                class="type-summary-item"
                :class="{ active: selectedType === item.key }"
                @click="selectedType = item.key"
              >
                <div class="type-summary-title">
                  <component :is="item.icon" :size="13" :color="item.color" />
                  <span>{{ item.label }}</span>
                </div>
                <strong>{{ item.count.toLocaleString() }}</strong>
              </button>
            </div>
          </a-card>

          <div class="filter-bar">
            <a-input v-model:value="searchKeyword" placeholder="搜索问题ID、问题内容或意图" class="search-input">
              <template #prefix>
                <Search :size="14" />
              </template>
            </a-input>
            <a-select v-model:value="industryFilter" :options="industryOptions" class="filter-select" />
            <a-select v-model:value="intentFilter" :options="intentOptions" class="filter-select" />
            <a-select v-model:value="statusFilter" :options="statusOptions" class="filter-select" />
            <a-select v-model:value="analysisPhaseFilter" :options="analysisPhaseOptions" class="filter-select" />
            <a-select v-model:value="testBatchFilter" :options="testBatchOptions" class="filter-select" />
            <a-button class="more-button" :icon="h(ChevronDown, { size: 14 })">
              更多筛选
            </a-button>
            <a-button @click="resetFilters" :icon="h(RefreshCcw, { size: 14 })">
              重置
            </a-button>
          </div>

          <div class="action-bar">
            <div class="action-bar-spacer" />
            <div class="toolbar-actions">
              <a-button type="primary" @click="openCreate" :icon="h(Plus, { size: 14 })">
                新增问题
              </a-button>
              <a-button type="primary" ghost @click="handleImport" :icon="h(Import, { size: 14 })">
                导入问题
              </a-button>
              <a-button v-show="false" type="primary" ghost @click="handleAIGenerate" :icon="h(Sparkles, { size: 14 })">
                AI 生成问题
              </a-button>
              <a-button danger :disabled="selectedCount === 0" @click="handleBatchDelete" :icon="h(Trash2, { size: 14 })">
                删除
              </a-button>
              <a-button type="primary" :disabled="selectedCount === 0" @click="handleGenerateTasks">
                生成测试任务
              </a-button>
            </div>
          </div>

          <a-card class="list-card" :style="{ borderColor: t.colorBorderSecondary }">
            <!-- 全选提示条 -->
            <div
              v-if="currentPageAllChecked && allFilteredIds.length > currentPageIds.length && !allSelected"
              class="select-all-banner"
              :style="{ background: t.colorFillQuaternary, borderColor: t.colorBorderSecondary }"
            >
              <span :style="{ color: t.colorTextSecondary }">
                已选择当前页 <strong>{{ selectedCount }}</strong> 条。共 <strong>{{ allFilteredIds.length }}</strong> 条匹配问题，
              </span>
              <a-button type="link" size="small" @click="selectAllFiltered">
                选择全部 {{ allFilteredIds.length }} 条
              </a-button>
            </div>

            <a-table
              :data-source="pagedRows"
              :loading="questionStore.loading"
              :pagination="false"
              :row-selection="rowSelection"
              row-key="id"
              size="middle"
              class="question-table"
            >
              <a-table-column title="问题ID" data-index="displayId" key="displayId" width="112" />

              <a-table-column title="问题内容" key="text" :ellipsis="true">
                <template #default="{ record }: { record: QuestionRow }">
                  <div class="question-text-cell">{{ record.text }}</div>
                </template>
              </a-table-column>

              <a-table-column title="问题类型" key="type" width="108">
                <template #default="{ record }: { record: QuestionRow }">
                  <a-tag :style="typeTagStyle(record.type)" class="soft-tag">{{ questionTypeMap[record.type] }}</a-tag>
                </template>
              </a-table-column>

              <a-table-column title="用户意图" data-index="intent" key="intent" width="108" />
              <a-table-column title="行业" data-index="industry" key="industry" width="96" />

              <a-table-column title="状态" key="status" width="92">
                <template #default="{ record }: { record: QuestionRow }">
                  <a-tag :color="statusTagColor(record.status)" class="soft-tag">
                    {{ record.status === 'enabled' ? '已发布' : record.status === 'pending' ? '审核中' : '草稿' }}
                  </a-tag>
                </template>
              </a-table-column>

              <a-table-column title="更新时间" data-index="updatedAt" key="updatedAt" width="150" />

              <a-table-column title="操作" key="action" width="120">
                <template #default="{ record }: { record: QuestionRow }">
                  <div class="action-icons">
                    <a-tooltip title="查看">
                      <a-button type="text" size="small" @click="openEdit(record)">
                        <Eye :size="14" />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="编辑">
                      <a-button type="text" size="small" @click="openEdit(record)">
                        <Pencil :size="14" />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="删除">
                      <a-button type="text" size="small" danger @click="confirmDeleteOne(record.id)">
                        <Trash2 :size="14" />
                      </a-button>
                    </a-tooltip>
                  </div>
                </template>
              </a-table-column>
            </a-table>

            <div class="table-footer">
              <div class="table-count">共 {{ filteredRows.length.toLocaleString() }} 条</div>

              <div class="table-pagination">
                <a-pagination
                  v-model:current="currentPage"
                  v-model:page-size="pageSize"
                  :total="filteredRows.length"
                  show-quick-jumper
                  show-size-changer
                  :page-size-options="['20', '50']"
                />
              </div>
            </div>
          </a-card>
        </div>
      </a-col>

    </a-row>

    <a-drawer
      v-model:open="drawerOpen"
      :title="editingId ? '编辑问题' : '新增问题'"
      :width="480"
      placement="right"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="问题内容" name="text" :rules="[{ required: true, message: '请输入问题内容' }]">
          <a-textarea v-model:value="form.text" :rows="4" />
        </a-form-item>

        <a-form-item label="问题类型" name="type" :rules="[{ required: true, message: '请选择问题类型' }]">
          <a-select
            v-model:value="form.type"
            :options="Object.entries(questionTypeMap).map(([key, label]) => ({ value: key, label }))"
          />
        </a-form-item>

        <a-form-item label="用户意图" name="intent">
          <a-input v-model:value="form.intent" />
        </a-form-item>

        <a-form-item label="行业" name="industry">
          <a-input v-model:value="form.industry" />
        </a-form-item>

        <div class="drawer-actions">
          <a-button @click="drawerOpen = false">取消</a-button>
          <a-button type="primary" :loading="submitting" @click="handleSubmit">保存</a-button>
        </div>
      </a-form>
    </a-drawer>

    <!-- ═══ 生成测试任务 Drawer ═══ -->
    <a-drawer
      v-model:open="batchDrawerOpen"
      title="生成测试任务"
      :width="480"
      placement="right"
    >
      <a-form layout="vertical">
        <a-form-item label="任务名称" required>
          <a-input v-model:value="batchForm.name" placeholder="如：CRM 品牌可见性测试-第1批" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="测试平台" required>
              <a-select v-model:value="batchForm.platformId" :options="platformOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="目标品牌" required>
              <a-select v-model:value="batchForm.brandId" :options="brandOpts" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="负责人">
          <a-input v-model:value="batchForm.assignedTo" placeholder="如：李四" />
        </a-form-item>

        <a-divider />
        <div :style="{ color: t.colorTextSecondary, fontSize: '13px', marginBottom: '8px' }">
          已选 {{ selectedCount }} 个问题
        </div>
        <div class="batch-question-list">
          <div v-for="qid in selectedRowKeys.slice(0, 10)" :key="qid" class="batch-question-item">
            {{ questionStore.questions.find(q => q.id === qid)?.text ?? qid }}
          </div>
          <div v-if="selectedCount > 10" :style="{ color: t.colorTextTertiary, fontSize: '12px' }">
            ...等共 {{ selectedCount }} 个问题
          </div>
        </div>
      </a-form>

      <div class="drawer-actions">
        <a-button @click="batchDrawerOpen = false">取消</a-button>
        <a-button type="primary" :loading="batchSubmitting" @click="handleBatchSubmit">创建任务</a-button>
      </div>
    </a-drawer>

    <!-- ═══ 导入问题 Modal ═══ -->
    <a-modal
      v-model:open="importModalOpen"
      :width="960"
      :footer="null"
      :title="null"
      centered
      destroy-on-close
      wrap-class-name="question-import-modal-wrap"
      :close-icon="h(X, { size: 20 })"
      @cancel="closeImportModal"
    >
      <div class="import-modal-body">
        <div class="import-modal-header">
          <div class="import-header-icon">
            <img :src="importIcon" alt="导入" width="70" height="70" />
          </div>
          <div class="import-header-copy">
            <h3>导入问题</h3>
            <p>通过模板批量导入题目，支持标准字段格式，导入更高效。</p>
          </div>
        </div>

        <a-steps :current="importStep" size="small" class="import-steps">
          <a-step v-for="step in importSteps" :key="step.title" :title="step.title" :description="step.description" />
        </a-steps>

        <div class="import-step-panel">
          <section v-if="importStep === 0" class="import-section">
            <h4>第一步：上传文件</h4>
            <p class="import-section-desc">先下载标准模板并填写内容，然后在当前步骤中直接上传文件。</p>
            <div class="template-card-row">
              <a-button  class="template-card" @click="downloadCsvTemplate">
                <div class="template-card-main">
                  <div class="template-card-icon csv">
                    <FileSpreadsheet :size="20" :color="t.colorSuccess" />
                  </div>
                  <span>CSV 模板</span>
                </div>
              </a-button>
              <a-button  class="template-card" @click="downloadExcelTemplate">
                <div class="template-card-main">
                  <div class="template-card-icon csv">
                    <FileSpreadsheet :size="20" :color="t.colorSuccess" />
                  </div>
                  <span>Excel 模板</span>
                </div>
              </a-button>
            </div>

            <a-upload-dragger
              class="import-dragger"
              :before-upload="onBeforeUpload"
              :show-upload-list="false"
              accept=".csv,.xls,.xlsx"
              @drop="draggingImport = false"
              @dragover.prevent="draggingImport = true"
              @dragleave.prevent="draggingImport = false"
            >
              <div class="import-dropzone" :class="{ dragging: draggingImport }">
                <div class="import-cloud">
                  <CloudUpload :size="54" :color="t.colorPrimary" />
                </div>
                <div class="import-drop-copy">
                  <h3>将文件拖拽到此处，或点击选择文件</h3>
                  <p>仅支持 .csv、.xls、.xlsx 格式</p>
                </div>
                <div class="import-drop-actions">
                  <a-button type="primary">选择文件</a-button>
                  <span class="import-selected-name">
                    {{ importFile ? importFile.name : '未选择任何文件' }}
                  </span>
                </div>
              </div>
            </a-upload-dragger>

            <div class="import-bottom-hint">
              <Info :size="16" :color="t.colorTextSecondary" />
              <span>支持 .csv、.xls、.xlsx 格式，第一行为表头</span>
            </div>
          </section>

          <section v-else-if="importStep === 1" class="import-section">
            <h4>第二步：导入预览</h4>
            <p class="import-section-desc">已解析 {{ importPreviewRows.length }} 条数据，请确认字段无误后开始导入。</p>

            <div class="import-preview-summary">
              <div class="import-summary-card">
                <span>文件名称</span>
                <strong>{{ importFile?.name ?? '未选择文件' }}</strong>
              </div>
              <div class="import-summary-card">
                <span>解析条数</span>
                <strong>{{ importPreviewRows.length }}</strong>
              </div>
              <div class="import-summary-card">
                <span>文件格式</span>
                <strong>{{ importFile?.name.split('.').pop()?.toUpperCase() ?? '--' }}</strong>
              </div>
            </div>

            <a-table
              :data-source="importPreviewVisibleRows"
              :pagination="false"
              size="small"
              :scroll="{ y: 260 }"
              row-key="text"
              class="import-preview-table"
            >
              <a-table-column title="问题内容" data-index="text" :ellipsis="true" width="280" />
              <a-table-column title="类型" data-index="type" width="100" />
              <a-table-column title="意图" data-index="intent" width="120" />
              <a-table-column title="行业" data-index="industry" width="100" />
              <a-table-column title="难度" data-index="difficulty" width="80" />
            </a-table>
          </section>

          <section v-else class="import-section">
            <h4>第三步：导入结果</h4>
            <p class="import-section-desc">本次导入已经执行完成，下面是导入结果汇总。</p>

            <div class="import-preview-summary">
              <div class="import-summary-card">
                <span>总数据量</span>
                <strong>{{ importResult.total }}</strong>
              </div>
              <div class="import-summary-card success">
                <span>导入成功</span>
                <strong>{{ importResult.success }}</strong>
              </div>
              <div class="import-summary-card warning">
                <span>导入失败</span>
                <strong>{{ importResult.fail }}</strong>
              </div>
            </div>

            <div class="import-result-panel">
              <div class="import-result-status">
                <div class="import-result-title">
                  {{ importResult.fail > 0 ? '导入已完成，部分数据导入失败' : '导入已完成，所有数据导入成功' }}
                </div>
                <div class="import-result-desc">
                  成功 {{ importResult.success }} 条
                  <span v-if="importResult.fail > 0">，失败 {{ importResult.fail }} 条</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="import-actions">
          <a-button v-if="importStep > 0" @click="goPrevImportStep" :icon="h(ArrowLeft, { size: 14 })">
            上一步
          </a-button>
          <a-button v-else @click="closeImportModal">取消</a-button>

          <div class="import-actions-right">
            <a-button v-if="importStep === 0" type="primary" @click="goNextImportStep" :icon="h(ArrowRight, { size: 14 })">
              下一步
            </a-button>
            <a-button
              v-else-if="importStep === 1"
              type="primary"
              :loading="importLoading"
              :disabled="!importFile || importPreviewRows.length === 0"
              @click="confirmImport"
            >
              开始导入
            </a-button>
            <template v-else>
              <a-button @click="restartImportFlow">继续导入</a-button>
              <a-button type="primary" @click="closeImportModal">完成</a-button>
            </template>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.questions-page {
  display: flex;
  flex-direction: column;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.page-description {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.page-description p {
  margin: 0;
  line-height: 1.5;
}

.type-summary-card :deep(.ant-card-body) {
  padding: 0;
}

.type-summary-list {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  overflow: hidden;
}

.type-summary-item {
  min-height: 86px;
  padding: 18px 16px 16px;
  border: none;
  border-right: 1px solid v-bind('t.colorBorderSecondary');
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.type-summary-item:last-child {
  border-right: none;
}

.type-summary-item.active {
  background: color-mix(in srgb, v-bind('t.colorPrimary') 8%, v-bind('t.colorBgContainer'));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, v-bind('t.colorPrimary') 28%, v-bind('t.colorBgContainer'));
}

.type-summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: v-bind('t.colorText');
  font-size: 14px;
  font-weight: 600;
}

.type-summary-item strong {
  color: v-bind('t.colorTextSecondary');
  font-size: 20px;
  font-weight: 700;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(260px, 1.7fr) repeat(5, minmax(108px, 0.7fr)) auto auto;
  gap: 12px;
}


.more-button :deep(.ant-btn-icon) {
  order: 2;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.action-bar-spacer {
  flex: 1;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-card :deep(.ant-card-body) {
  padding: 0;
}

.select-all-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid;
  font-size: 13px;
}

.question-table :deep(.ant-table) {
  border-radius: 0;
}

.question-table :deep(.ant-table-thead > tr > th) {
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 12px;
  font-weight: 600;
  color: v-bind('t.colorTextSecondary');
  background: v-bind('t.colorFillQuaternary');
}

.question-table :deep(.ant-table-tbody > tr > td) {
  padding-top: 14px;
  padding-bottom: 14px;
  font-size: 13px;
  color: v-bind('t.colorTextSecondary');
}

.question-table :deep(.ant-table-tbody > tr:hover > td) {
  background: color-mix(in srgb, v-bind('t.colorPrimary') 2%, v-bind('t.colorBgContainer'));
}

.question-text-cell {
  display: -webkit-box;
  overflow: hidden;
  color: v-bind('t.colorText');
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-icons :deep(.ant-btn) {
  color: v-bind('t.colorTextTertiary');
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 16px 16px;
}

.table-count {
  color: v-bind('t.colorTextSecondary');
  font-size: 13px;
}

.table-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  color: v-bind('t.colorTextSecondary');
  font-size: 13px;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.batch-question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.batch-question-item {
  padding: 8px 12px;
  border-radius: 8px;
  background: v-bind('t.colorFillQuaternary');
  color: v-bind('t.colorText');
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 1399px) {
  .type-summary-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .type-summary-list,
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .action-bar,
  .toolbar-actions,
  .table-footer,
  .table-pagination {
    align-items: stretch;
    flex-direction: column;
  }
}

/* ── 导入 Modal ── */
.import-modal-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 4px 4px;
}

.import-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.import-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: color-mix(in srgb, v-bind('t.colorPrimary') 10%, v-bind('t.colorBgContainer'));
}

.import-header-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.import-header-copy h3 {
  margin: 0;
  color: v-bind('t.colorText');
  font-size: 24px;
  line-height: 1.2;
  font-weight: 500;
}

.import-header-copy p {
  margin: 0;
  color: v-bind('t.colorTextSecondary');
  font-size: 14px;
  line-height: 1.6;
}

.import-steps {
  margin-bottom: 8px;
}

.import-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.import-section h4 {
  margin: 0;
  color: v-bind('t.colorText');
  font-size: 18px;
  font-weight: 700;
}

.import-section-desc {
  margin: -4px 0 0;
  color: v-bind('t.colorTextSecondary');
  font-size: 14px;
  line-height: 1.6;
}

.import-step-panel {
  min-height: 420px;
}

.template-card-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.template-card {
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 24px;
}

.template-card-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.template-card-main span {
  color: v-bind('t.colorText');
  font-size: 15px;
  font-weight: 600;
}


.import-divider {
  margin: 2px 0 0;
}

.import-dragger :deep(.ant-upload),
.import-dragger :deep(.ant-upload-drag) {
  background: transparent;
}

.import-dragger :deep(.ant-upload-wrapper .ant-upload-drag) {
  border: none;
  background: transparent;
}

.import-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-height: 274px;
  padding: 32px 24px;
  border: 2px dashed color-mix(in srgb, v-bind('t.colorPrimary') 42%, v-bind('t.colorBgContainer'));
  border-radius: 16px;
  background: color-mix(in srgb, v-bind('t.colorPrimary') 1.5%, v-bind('t.colorBgContainer'));
  transition: all 0.2s ease;
}

.import-dropzone.dragging {
  background: color-mix(in srgb, v-bind('t.colorPrimary') 5%, v-bind('t.colorBgContainer'));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, v-bind('t.colorPrimary') 24%, v-bind('t.colorBgContainer'));
}

.import-cloud {
  display: flex;
  justify-content: center;
}

.import-drop-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.import-drop-copy h3 {
  margin: 0;
  color: v-bind('t.colorText');
  font-size: 19px;
  font-weight: 700;
}

.import-drop-copy p {
  margin: 0;
  color: v-bind('t.colorTextSecondary');
  font-size: 14px;
}

.import-drop-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.import-selected-name {
  color: v-bind('t.colorTextTertiary');
  font-size: 15px;
}

.import-preview-note {
  color: v-bind('t.colorSuccess');
  font-size: 14px;
  font-weight: 600;
}

.import-preview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.import-summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid v-bind('t.colorBorderSecondary');
  border-radius: 14px;
  background: color-mix(in srgb, v-bind('t.colorPrimary') 2%, v-bind('t.colorBgContainer'));
}

.import-summary-card span {
  color: v-bind('t.colorTextSecondary');
  font-size: 13px;
}

.import-summary-card strong {
  color: v-bind('t.colorText');
  font-size: 16px;
  font-weight: 700;
}

.import-summary-card.success {
  background: color-mix(in srgb, v-bind('t.colorSuccess') 6%, v-bind('t.colorBgContainer'));
}

.import-summary-card.warning {
  background: color-mix(in srgb, v-bind('t.colorWarning') 7%, v-bind('t.colorBgContainer'));
}

.import-preview-table :deep(.ant-table-thead > tr > th) {
  color: v-bind('t.colorTextSecondary');
  background: v-bind('t.colorFillQuaternary');
  font-size: 12px;
}

.import-result-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 28px 24px;
  border: 1px solid v-bind('t.colorBorderSecondary');
  border-radius: 18px;
  background: color-mix(in srgb, v-bind('t.colorPrimary') 2%, v-bind('t.colorBgContainer'));
}

.import-result-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.import-result-title {
  color: v-bind('t.colorText');
  font-size: 20px;
  font-weight: 700;
}

.import-result-desc {
  color: v-bind('t.colorTextSecondary');
  font-size: 14px;
  line-height: 1.6;
}

.import-bottom-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: v-bind('t.colorTextSecondary');
  font-size: 14px;
}

.import-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.import-actions-right {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

:deep(.question-import-modal-wrap .ant-modal-content) {
  border-radius: 28px;
  padding: 22px 26px 24px;
}

:deep(.question-import-modal-wrap .ant-modal-close) {
  top: 22px;
  inset-inline-end: 22px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: v-bind('t.colorFillSecondary');
}

:deep(.question-import-modal-wrap .ant-modal-close-x) {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .import-modal-header {
    flex-direction: column;
  }

  .template-card-row,
  .import-preview-summary {
    flex-direction: column;
    grid-template-columns: 1fr;
  }

  .import-dropzone {
    min-height: 240px;
    padding-inline: 16px;
  }

  .import-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .import-actions :deep(.ant-btn) {
    width: 100%;
  }

  .import-actions-right {
    width: 100%;
  }
}
</style>
