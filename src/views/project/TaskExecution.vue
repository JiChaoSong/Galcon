<script setup lang="ts">
import { computed, h, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message, theme } from 'ant-design-vue'
import {
  Bot,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  Eye,
  Lightbulb,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from '@lucide/vue'
import { marked } from 'marked'
import { useTaskStore, taskStatusMap } from '@/stores/task'
import type { AnswerAnalysis, TaskItem } from '@/stores/task'

type QueueTab = 'all' | 'pending' | 'review' | 'done' | 'error'

interface InsightCard {
  key: string
  title: string
  value: string
  description: string
  confidence: number
  icon: unknown
  accent: string
}

const route = useRoute()
const store = useTaskStore()
const { token: t } = theme.useToken()

const batchId = route.params.batchId as string
const projectId = route.params.id as string

const batch = computed(() => store.getBatch(batchId))
const batchItems = computed(() => store.getBatchItems(batchId))
const projectTasks = computed(() => store.tasks.filter((item) => item.projectId === projectId))

const queueTab = ref<QueueTab>('all')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = 6

const selectedItemId = ref('')
const promptDraft = ref('')
const answerDraft = ref('')
const answerPreview = ref(false)

const renderedAnswer = computed(() => {
  if (!answerDraft.value) return ''
  return marked(answerDraft.value) as string
})

onMounted(async () => {
  await Promise.all([
    store.fetchBatches(projectId),
    store.fetchItems(batchId),
    store.fetchTaskStats(projectId),
  ])
})

const panelVars = computed(() => ({
  '--panel-border': t.value.colorBorderSecondary,
  '--panel-fill': t.value.colorFillQuaternary,
  '--panel-fill-strong': t.value.colorFillSecondary,
  '--panel-text': t.value.colorText,
  '--panel-text-secondary': t.value.colorTextSecondary,
  '--panel-text-tertiary': t.value.colorTextTertiary,
  '--panel-primary': t.value.colorPrimary,
  '--panel-success': t.value.colorSuccess,
  '--panel-warning': t.value.colorWarning,
  '--panel-error': t.value.colorError,
  '--panel-card-radius': `${t.value.borderRadiusLG}px`,
}))

const platformOptions = computed(() => {
  const seen = new Map<string, string>()
  seen.set('', '全部平台')
  for (const b of store.batches) {
    if (b.platformId && !seen.has(b.platformId)) {
      seen.set(b.platformId, b.platformName)
    }
  }
  return Array.from(seen.entries()).map(([value, label]) => ({ value, label }))
})

const queueCounts = computed(() => ({
  all: batchItems.value.length,
  pending: batchItems.value.filter((item) => item.status === 'pending').length,
  review: batchItems.value.filter((item) => item.status === 'review').length,
  done: batchItems.value.filter((item) => item.status === 'done').length,
  error: batchItems.value.filter((item) => item.status === 'error').length,
}))

const progressStats = computed(() => {
  const stats = store.taskStats
  if (stats) {
    return {
      total: stats.total || 1,
      completed: stats.completed,
      percent: stats.percent,
      pass: stats.pass,
      partial: stats.partial,
      failed: stats.failed,
      pending: stats.pending,
    }
  }
  // fallback: 本地计算
  const total = projectTasks.value.length || batchItems.value.length || 1
  const completed = projectTasks.value.filter((item) => item.status === 'done' || item.status === 'review').length
  const pass = projectTasks.value.filter((item) => store.getAnalysis(item.id)?.accuracyStatus === 'accurate').length
  const partial = projectTasks.value.filter((item) => store.getAnalysis(item.id)?.accuracyStatus === 'partial').length
  const failed =
    projectTasks.value.filter((item) => item.status === 'error').length +
    projectTasks.value.filter((item) => store.getAnalysis(item.id)?.accuracyStatus === 'wrong').length

  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100),
    pass,
    partial,
    failed,
    pending: Math.max(total - completed, 0),
  }
})

const filteredItems = computed(() => {
  let list = batchItems.value

  if (queueTab.value === 'pending') list = list.filter((item) => item.status === 'pending')
  if (queueTab.value === 'review') list = list.filter((item) => item.status === 'review')
  if (queueTab.value === 'done') list = list.filter((item) => item.status === 'done')
  if (queueTab.value === 'error') list = list.filter((item) => item.status === 'error')

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
        list = list.filter(
      (item) =>
        item.questionText.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        (item.answerText ?? '').toLowerCase().includes(keyword),
    )
  }

  return list
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

const selectedItem = computed(() => batchItems.value.find((item) => item.id === selectedItemId.value) ?? null)
const selectedAnalysis = computed<AnswerAnalysis | null>(() => {
  if (!selectedItem.value) return null
  return store.getAnalysis(selectedItem.value.id) ?? null
})

const estimatedRemainText = computed(() => {
  const minutes = progressStats.value.pending * 8
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `预计剩余 ${hours ? `${hours}小时` : ''}${rest}分钟`
})

const analysisCards = computed<InsightCard[]>(() => {
  if (!selectedAnalysis.value) return []

  return [
    {
      key: 'mention',
      title: '目标品牌是否出现',
      value: selectedAnalysis.value.targetBrandMentioned ? '是' : '否',
      description: selectedAnalysis.value.targetBrandMentioned ? '在回答中检测到目标品牌' : '当前回答未识别到目标品牌',
      confidence: 98,
      icon: CheckCircle2,
      accent: t.value.colorSuccess,
    },
    {
      key: 'rank',
      title: '品牌排名',
      value: selectedAnalysis.value.targetBrandRank > 0 ? `第 ${selectedAnalysis.value.targetBrandRank} 位` : '未进入排名',
      description:
        selectedAnalysis.value.targetBrandRank > 0
          ? `在推荐列表对比中排名第 ${selectedAnalysis.value.targetBrandRank}`
          : '当前答案未形成明确排名',
      confidence: 92,
      icon: Sparkles,
      accent: t.value.colorPrimary,
    },
    {
      key: 'mentions',
      title: '提及品牌',
      value: `${selectedAnalysis.value.mentionedBrands.length} 个`,
      description: selectedAnalysis.value.mentionedBrands.join('、') || '无品牌提及',
      confidence: 95,
      icon: Bot,
      accent: t.value.colorPrimary,
    },
    {
      key: 'competitors',
      title: '竞品品牌',
      value: `${selectedAnalysis.value.competitorsMentioned.length} 个`,
      description: selectedAnalysis.value.competitorsMentioned.join('、') || '未识别到竞品品牌',
      confidence: 94,
      icon: ClipboardList,
      accent: t.value.colorPrimary,
    },
  ]
})

const sentimentTextMap: Record<AnswerAnalysis['sentiment'], string> = {
  positive: '积极',
  neutral: '中性',
  negative: '负面',
  mixed: '混合',
}

const accuracyTextMap: Record<AnswerAnalysis['accuracyStatus'], string> = {
  accurate: '准确',
  partial: '部分准确',
  wrong: '不准确',
  unknown: '待确认',
}

const confidencePercent = computed(() => {
  if (!selectedAnalysis.value) return 0
  if (selectedAnalysis.value.manualChecked) return 92
  if (selectedAnalysis.value.accuracyStatus === 'accurate') return 88
  if (selectedAnalysis.value.accuracyStatus === 'partial') return 76
  return 68
})

const confidenceLabel = computed(() => {
  if (confidencePercent.value >= 90) return '高置信'
  if (confidencePercent.value >= 75) return '中高置信'
  return '待复核'
})

watch(
  filteredItems,
  (list) => {
    const exists = list.some((item) => item.id === selectedItemId.value)
    if (!exists) {
      selectedItemId.value = list[0]?.id ?? ''
    }

    const pageTotal = Math.max(Math.ceil(list.length / pageSize), 1)
    if (currentPage.value > pageTotal) currentPage.value = 1
  },
  { immediate: true },
)

watch(
  selectedItem,
  async (item) => {
    if (!item) {
      promptDraft.value = ''
      answerDraft.value = ''
      return
    }

    promptDraft.value = buildPrompt(item)
    answerDraft.value = item.answerText || buildFallbackAnswer(item)

    // 拉取已有的分析结果
    if (!store.getAnalysis(item.id)) {
      await store.fetchAnalysis(item.id)
    }
  },
  { immediate: true },
)

watch([queueTab, searchKeyword], () => {
  currentPage.value = 1
})

function buildPrompt(item: TaskItem) {
  const platformName = batch.value?.platformName ?? '当前平台'
  return `请基于权威信息和最佳实践，详细回答用户问题，要求结构清晰、内容准确，适合中小企业决策参考。当前分析平台：${platformName}。问题：${item.questionText}`
}

function buildFallbackAnswer(item: TaskItem) {
  return [
    `## 问题分析`,
    ``,
    `针对「**${item.questionText}**」这一问题，建议从企业规模、业务阶段、预算与未来扩展性等方面综合评估。`,
    ``,
    `### 1. 明确核心需求`,
    ``,
    `- 是否需要客户管理、销售流程跟进、线索追踪与报表分析`,
    `- 是否要求与邮箱、ERP、财务或客服系统打通`,
    `- 团队规模与IT支持能力`,
    ``,
    `### 2. 关注易用性与实施成本`,
    ``,
    `- 中小企业更适合**上手快、培训成本低、部署周期短**的系统`,
    `- 优先考虑 SaaS 模式，降低运维负担`,
    ``,
    `### 3. 推荐系统对比`,
    ``,
    `| 系统 | 优势 | 适用场景 |`,
    `|------|------|----------|`,
    `| **Zoho CRM** | 功能全面，性价比高 | 预算敏感型团队 |`,
    `| **HubSpot CRM** | 免费版能力强，营销协同好 | 注重营销自动化 |`,
    `| **Salesforce Essentials** | 生态完整，扩展性强 | 有后续扩张计划 |`,
    `| **Pipedrive** | 可视化管线，简单直观 | 销售流程驱动型 |`,
    ``,
    `### 4. 实施建议`,
    ``,
    `> 💡 建议先试用 2-3 款系统的免费版本，用真实业务场景做 POC，重点关注团队实际使用体验和与现有工具的集成便利性。`,
  ].join('\n')
}

function queueItemPlatform() {
  return batch.value?.platformName ?? '未设置平台'
}

function copyQuestion() {
  if (!selectedItem.value) return
  navigator.clipboard?.writeText(selectedItem.value.questionText)
  message.success('问题已复制')
}

function copyAnswer() {
  if (!answerDraft.value) return
  navigator.clipboard?.writeText(answerDraft.value)
  message.success('答案已复制')
}

function clearAnswer() {
  answerDraft.value = ''
  message.info('已清空当前回答内容')
}

async function saveAnswer() {
  if (!selectedItem.value) return
  try {
    await store.saveAnswer(selectedItem.value.id, answerDraft.value)
    message.success('结果已保存')
  } catch (e: any) {
    message.error(e?.message ?? '保存失败')
  }
}

async function submitAnalysis() {
  if (!selectedItem.value) return
  try {
    await store.saveAnswer(selectedItem.value.id, answerDraft.value)
    await store.setItemStatus(selectedItem.value.id, 'review')
    // 触发 AI 分析
    await store.requestAnalysis(selectedItem.value.id)
    await store.fetchTaskStats(projectId)
    message.success('已提交并完成分析')
  } catch (e: any) {
    message.error(e?.message ?? '提交失败')
  }
}

function exportResult() {
  message.info('导出本页结果功能开发中')
}

async function reAnalyze() {
  if (!selectedItem.value) return
  try {
    message.loading({ content: '正在重新分析...', key: 'reanalyze' })
    await store.requestAnalysis(selectedItem.value.id)
    await store.fetchTaskStats(projectId)
    message.success({ content: '分析完成', key: 'reanalyze' })
  } catch (e: any) {
    message.error({ content: e?.message ?? '分析失败', key: 'reanalyze' })
  }
}
</script>

<template>
  <div v-if="batch" class="task-console" :style="panelVars">
    <div class="console-head">
      <a-row :gutter="[16, 16]" align="middle" class="console-head-row">
        <a-col :xs="24" :xl="6">
          <div class="page-title">
            <div class="title-icon">
              <ClipboardList :size="18" />
            </div>
            <div>
              <h2>测试任务执行台</h2>
              <p>执行测试任务并对 AI 回答进行结构化分析与评估</p>
            </div>
          </div>
        </a-col>

        <a-col :xs="24" :xl="15">
          <a-card class="progress-card" :style="{ borderColor: t.colorBorderSecondary }">
            <div class="progress-inline">
              <div class="progress-track-section">
                <div class="progress-header-line">
                  <span class="progress-title">任务进度</span>
                  <span class="progress-done">
                    已完成
                    <strong>{{ progressStats.completed }} / {{ progressStats.total }}</strong>
                  </span>
                  <span class="progress-percent">{{ progressStats.percent }}%</span>
                </div>

                <div class="progress-bar-row">
                  <a-progress :percent="progressStats.percent" :show-info="false" class="progress-line" />
                  <span class="progress-foot">{{ estimatedRemainText }}</span>
                </div>
              </div>

              <div class="progress-stats">
                <div class="progress-stat">
                  <span class="stat-label">通过</span>
                  <strong class="stat-pass">{{ progressStats.pass }}</strong>
                </div>
                <div class="progress-stat">
                  <span class="stat-label">部分通过</span>
                  <strong class="stat-warn">{{ progressStats.partial }}</strong>
                </div>
                <div class="progress-stat">
                  <span class="stat-label">未通过</span>
                  <strong class="stat-fail">{{ progressStats.failed }}</strong>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :xl="3" class="export-action-col">
          <a-button type="primary" ghost @click="exportResult" class="export-button" :icon="h(Download, { size: 16 })">
            导出本页结果
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :xl="6">
        <a-card title="任务队列" class="console-card" :style="{ borderColor: t.colorBorderSecondary }">
          <div class="queue-tabs">
            <a-checkable-tag :checked="queueTab === 'all'" @change="queueTab = 'all'">全部（{{ queueCounts.all }}）</a-checkable-tag>
            <a-checkable-tag :checked="queueTab === 'pending'" @change="queueTab = 'pending'">待测试（{{ queueCounts.pending }}）</a-checkable-tag>
            <a-checkable-tag :checked="queueTab === 'review'" @change="queueTab = 'review'">待复核（{{ queueCounts.review }}）</a-checkable-tag>
            <a-checkable-tag :checked="queueTab === 'done'" @change="queueTab = 'done'">已完成（{{ queueCounts.done }}）</a-checkable-tag>
            <a-checkable-tag :checked="queueTab === 'error'" @change="queueTab = 'error'">异常（{{ queueCounts.error }}）</a-checkable-tag>
          </div>

          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索任务 ID 或问题内容"
            class="queue-search"
          >
            <template #prefix>
              <Search :size="14" />
            </template>
          </a-input>


          <div class="queue-list">
            <div
              v-for="item in pagedItems"
              :key="item.id"
              class="queue-item"
              :class="{ active: selectedItemId === item.id }"
              @click="selectedItemId = item.id"
            >
              <div class="queue-item-top">
                <div class="queue-item-question">{{ item.questionText }}</div>

                <a-tag :color="taskStatusMap[item.status]?.color">
                  {{ taskStatusMap[item.status]?.label }}
                </a-tag>
              </div>


              <div class="queue-item-platform">
                <Bot :size="13" />
                <span>{{ queueItemPlatform() }}</span>
              </div>
            </div>

            <a-empty v-if="!pagedItems.length" :image="false" description="暂无任务" />
          </div>

          <div class="queue-footer">
            <a-pagination
              v-model:current="currentPage"
              size="small"
              :page-size="pageSize"
              :total="filteredItems.length"
              :show-size-changer="false"
            />
            <span>共 {{ filteredItems.length }} 条</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="10">
        <a-card class="console-card" :style="{ borderColor: t.colorBorderSecondary }">
          <template #title>当前任务详情</template>
          <template v-if="selectedItem" #extra>
            <a-tag :color="taskStatusMap[selectedItem.status]?.color">
              {{ taskStatusMap[selectedItem.status]?.label }}
            </a-tag>
          </template>
          <template v-if="selectedItem">
            <div class="detail-section">
              <div class="section-label">
                <span>问题内容</span>
                <a-button  class="section-action" @click="copyQuestion" :icon="h(Copy, { size: 14 })">
                  复制问题
                </a-button>
              </div>

              <div class="content-box">{{ selectedItem.questionText }}</div>

            </div>

            <div class="detail-section">
              <div class="section-label">目标平台</div>
              <a-select disabled :value="batch.platformId" :options="platformOptions.slice(1)" class="full-width"/>
            </div>

            <div class="detail-section detail-section-answer">
              <div class="section-label">
                <span>AI 回答内容</span>
                <a-button
                  @click="answerPreview = !answerPreview"
                  :icon="h(answerPreview ? Edit3 : Eye, { size: 14 })"
                  class="section-action"
                >
                  {{ answerPreview ? '编辑' : '预览' }}
                </a-button>
              </div>
              <div>
                <!-- 编辑模式 -->
                <a-textarea
                    v-if="!answerPreview"
                    v-model:value="answerDraft"
                    :rows="15"
                    placeholder="请输入或粘贴 Markdown 格式的 AI 回答内容"
                />

                <!-- 预览模式 -->
                <div
                    v-else
                    class="content-box markdown-preview"
                    v-html="renderedAnswer"
                />
              </div>
            </div>


            <div class="detail-actions">

              <a-button @click="clearAnswer">清空内容</a-button>
              <a-button @click="copyAnswer" :icon="h(Copy, { size: 14 })">
                复制答案
              </a-button>
              <a-button type="primary" @click="saveAnswer" :icon="h(Save, { size: 14 })">
                保存结果
              </a-button>
              <a-button type="primary" ghost @click="submitAnalysis" :icon="h(Send, { size: 14 })">
                提交分析
              </a-button>
            </div>
          </template>

          <a-empty v-else description="请选择一条任务开始执行" />
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="8">
        <a-card title="AI 分析结果" class="console-card" :style="{ borderColor: t.colorBorderSecondary }">
          <template #extra>
            <a-button size="small" @click="reAnalyze" :icon="h(RefreshCw, { size: 14 })">
              重新分析
            </a-button>
          </template>

          <template v-if="selectedAnalysis">
            <div class="analysis-meta">
              <span>基于 GEO 分析模型</span>
              <span>分析时间：{{ selectedItem?.testedAt || batch.createdAt }}</span>
            </div>

            <div class="analysis-card-list">
              <div v-for="card in analysisCards" :key="card.key" class="analysis-card">
                <div class="analysis-card-main">
                  <div class="analysis-icon" :style="{ color: card.accent, background: t.colorFillQuaternary }">
                    <component :is="card.icon" :size="18" />
                  </div>
                  <div class="analysis-copy">
                    <div class="analysis-title">{{ card.title }}</div>
                    <div class="analysis-value">{{ card.value }}</div>
                    <div class="analysis-desc">{{ card.description }}</div>
                  </div>
                </div>
                <div class="analysis-confidence">{{ card.confidence }}%</div>
              </div>
            </div>

            <div class="analysis-block">
              <div class="block-title">引用来源</div>
              <ul class="source-list">
                <li v-for="source in selectedAnalysis.citationSources" :key="source">{{ source }}</li>
                <li v-if="!selectedAnalysis.citationSources.length">暂无引用来源</li>
              </ul>
            </div>

            <div class="analysis-card-list compact">
              <div class="analysis-card">
                <div class="analysis-card-main">
                  <div class="analysis-icon" :style="{ color: t.colorSuccess, background: t.colorFillQuaternary }">
                    <CheckCircle2 :size="18" />
                  </div>
                  <div class="analysis-copy">
                    <div class="analysis-title">情绪 / 准确性</div>
                    <div class="analysis-value">{{ sentimentTextMap[selectedAnalysis.sentiment] }} / {{ accuracyTextMap[selectedAnalysis.accuracyStatus] }}</div>
                    <div class="analysis-desc">内容语气与信息完整度综合判断</div>
                  </div>
                </div>
                <div class="analysis-confidence">93%</div>
              </div>

              <div class="analysis-card">
                <div class="analysis-card-main">
                  <div class="analysis-icon" :style="{ color: t.colorSuccess, background: t.colorFillQuaternary }">
                    <ShieldCheck :size="18" />
                  </div>
                  <div class="analysis-copy">
                    <div class="analysis-title">风险等级</div>
                    <div class="analysis-value">{{ selectedAnalysis.riskTypes.length ? '需关注' : '低风险' }}</div>
                    <div class="analysis-desc">{{ selectedAnalysis.riskTypes.join('、') || '无明显错误、无夸大宣传、内容合规' }}</div>
                  </div>
                </div>
                <div class="analysis-confidence">96%</div>
              </div>

              <div class="analysis-card">
                <div class="analysis-card-main">
                  <div class="analysis-icon" :style="{ color: t.colorWarning, background: t.colorFillQuaternary }">
                    <Lightbulb :size="18" />
                  </div>
                  <div class="analysis-copy">
                    <div class="analysis-title">优化建议</div>
                    <div class="analysis-value">建议补强优势表达</div>
                    <div class="analysis-desc">建议补充行业场景、对比卖点与可信信源，提升推荐概率。</div>
                  </div>
                </div>
                <div class="analysis-confidence">78%</div>
              </div>
            </div>

            <div class="confidence-panel">
              <div>
                <div class="block-title">综合置信度</div>
                <div class="confidence-desc">综合判断本次回答对品牌的正向影响较高</div>
              </div>

              <div class="confidence-ring">
                <a-progress type="circle" :percent="confidencePercent" :width="88">
                  <template #format>
                    <strong>{{ confidencePercent }}%</strong>
                  </template>
                </a-progress>
                <a-tag color="green">{{ confidenceLabel }}</a-tag>
              </div>
            </div>
          </template>

          <a-empty v-else description="暂无分析结果" />
        </a-card>
      </a-col>
    </a-row>
  </div>

  <a-empty v-else description="任务不存在" />
</template>

<style scoped>
.task-console {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.console-head-row {
  width: 100%;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--panel-primary);
  background: var(--panel-fill-strong);
  flex-shrink: 0;
}

.page-title h2 {
  margin: 0;
  color: var(--panel-text);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
}

.page-title p {
  margin: 4px 0 0;
  color: var(--panel-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.export-action-col {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.export-button {
  height: 40px;
  padding-inline: 14px;
}

.progress-card :deep(.ant-card-body) {
  padding: 14px 18px;
}

.progress-inline {
  display: flex;
  align-items: center;
  gap: 24px;
}

.progress-track-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-header-line {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-title {
  color: var(--panel-text);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.progress-done,
.progress-foot,
.analysis-meta,
.detail-time,
.analysis-desc,
.source-list,
.confidence-desc {
  color: var(--panel-text-secondary);
}

.progress-done strong {
  color: var(--panel-success);
  font-weight: 700;
}

.progress-percent {
  margin-left: auto;
  color: var(--panel-primary);
  font-size: 16px;
  font-weight: 700;
}

.progress-bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-line {
  flex: 1;
}

.progress-line :deep(.ant-progress-bg) {
  height: 6px !important;
  border-radius: 999px;
}

.progress-line :deep(.ant-progress-inner) {
  border-radius: 999px;
}

.progress-foot {
  font-size: 12px;
  white-space: nowrap;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: 300px;
}

.progress-stat {
  padding: 0 18px;
  border-left: 1px solid var(--panel-border);
}

.stat-label {
  display: block;
  margin-bottom: 6px;
  color: var(--panel-text-secondary);
  font-size: 12px;
}

.progress-stat strong {
  font-size: 18px;
  line-height: 1;
}

.stat-pass {
  color: var(--panel-success);
}

.stat-warn {
  color: var(--panel-warning);
}

.stat-fail {
  color: var(--panel-error);
}

.console-card :deep(.ant-card-head-title) {
  font-weight: 600;
}

.console-card :deep(.ant-card-extra .ant-tag) {
  margin-inline-end: 0;
}

.queue-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.queue-tabs :deep(.ant-tag-checkable) {
  margin-inline-end: 0;
}

.queue-search {
  margin-bottom: 12px;
}

.queue-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 640px;
}

.queue-item {
  padding: 12px;
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-card-radius);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.queue-item:hover,
.queue-item.active {
  border-color: var(--panel-primary);
  background: var(--panel-fill);
}

.queue-item.active {
  transform: translateY(-1px);
}

.queue-item-top,
.detail-head,
.detail-id-row,
.analysis-card,
.analysis-card-main,
.confidence-panel,
.queue-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.queue-item-id,
.queue-item-platform {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--panel-text-secondary);
  font-size: 12px;
}

.queue-item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--panel-primary);
}

.queue-item-question,
.analysis-title,
.block-title,
.section-label,
.detail-id {
  color: var(--panel-text);
  font-weight: 600;
}

.queue-item-question {
  margin: 10px 0;
  line-height: 1.6;
}

.queue-footer {
  margin-top: 12px;
  color: var(--panel-text-tertiary);
  font-size: 12px;
}

.detail-head {
  margin-bottom: 16px;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section-answer {
  padding-top: 16px;
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.section-action {
  font-size: 12px;
}

.markdown-preview {
  max-height: 520px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
}

.markdown-preview :deep(h2) {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--panel-text);
  border-bottom: 1px solid var(--panel-border);
  padding-bottom: 8px;
}

.markdown-preview :deep(h3) {
  margin: 16px 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--panel-text);
}

.markdown-preview :deep(h4) {
  margin: 12px 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--panel-text);
}

.markdown-preview :deep(p) {
  margin: 0 0 10px;
  color: var(--panel-text);
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0 0 10px;
  padding-left: 24px;
  color: var(--panel-text);
}

.markdown-preview :deep(li) {
  margin-bottom: 4px;
}

.markdown-preview :deep(blockquote) {
  margin: 0 0 10px;
  padding: 8px 16px;
  border-left: 3px solid var(--panel-primary);
  background: var(--panel-fill-strong);
  border-radius: 4px;
  color: var(--panel-text-secondary);
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  font-size: 13px;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--panel-border);
  text-align: left;
}

.markdown-preview :deep(th) {
  background: var(--panel-fill-strong);
  font-weight: 600;
  color: var(--panel-text);
}

.markdown-preview :deep(td) {
  color: var(--panel-text);
}

.markdown-preview :deep(code) {
  padding: 2px 6px;
  background: var(--panel-fill-strong);
  border-radius: 4px;
  font-size: 13px;
  color: var(--panel-primary);
}

.markdown-preview :deep(pre) {
  padding: 12px 16px;
  background: var(--panel-fill-strong);
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 10px;
}

.markdown-preview :deep(strong) {
  font-weight: 600;
  color: var(--panel-text);
}

.content-box {
  padding: 14px 16px;
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-card-radius);
  color: var(--panel-text);
  background: var(--panel-fill);
  line-height: 1.6;
}

.full-width {
  width: 100%;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.analysis-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  font-size: 12px;
}

.analysis-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-card-list.compact {
  margin-top: 12px;
}

.analysis-card {
  padding: 12px 14px;
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-card-radius);
  align-items: flex-start;
}

.analysis-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.analysis-copy {
  flex: 1;
  min-width: 0;
}

.analysis-value {
  margin: 4px 0 6px;
  color: var(--panel-text);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.analysis-confidence {
  color: var(--panel-success);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.analysis-block {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-fill);
}

.block-title {
  margin-bottom: 10px;
}

.source-list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.8;
}

.confidence-panel {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  align-items: flex-end;
}

.confidence-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1200px) {
  .progress-inline {
    flex-direction: column;
    align-items: stretch;
  }

  .progress-stats {
    grid-template-columns: 1fr;
    min-width: 0;
  }

  .progress-stat {
    padding: 0;
    border-left: none;
  }
}

@media (max-width: 768px) {
  .page-title h2 {
    font-size: 18px;
  }

  .progress-header-line,
  .progress-bar-row,
  .analysis-meta,
  .confidence-panel,
  .queue-footer,
  .detail-head,
  .export-action-col {
    flex-direction: column;
    align-items: flex-start;
  }

  .progress-percent {
    margin-left: 0;
  }

  .queue-filters {
    grid-template-columns: 1fr;
  }
}
</style>
