<script setup lang="ts">
import { computed, h, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, theme } from 'ant-design-vue'
import { ChevronRight, CircleHelp, Copy, Download, FileText, MoreHorizontal, Settings2, Share2 } from '@lucide/vue'
import { useProjectStore } from '@/stores/project'
import { usePlatformStore } from '@/stores/platform'
import { softTagStyle } from '@/composables/useTagStyle'

interface MetricCard {
  key: string
  title: string
  value: string
  delta: string
  compare: string
  color: string
  trend: number
}

interface CompetitorRow {
  key: string
  rank: number
  brand: string
  tag?: string
  type: string
  mentionRate: string
  mentionDelta: string
  recommendRate: string
  recommendDelta: string
  avgRank: string
  avgRankDelta: string
  rankChange: string
  trend: number
}

interface InsightRow {
  id: string
  level: '机会' | '风险'
  title: string
  description: string
  time: string
}

interface RelationPoint {
  name: string
  x: string
  y: string
  color: string
}

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const { token: t } = theme.useToken()

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.current)
const platformStore = usePlatformStore()

onMounted(async () => {
  await projectStore.fetchProject(projectId.value)
})

const typeMap: Record<string, string> = {
  sample: '样板项目',
  client: '客户诊断',
  monthly: '月度复测',
}

const statusMap: Record<string, { label: string; color: string }> = {
  preparing: { label: '准备中', color: 'default' },
  testing: { label: '测试中', color: 'processing' },
  analyzing: { label: '分析中', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
}

const projectCode = computed(() => {
  if (!project.value) return ''
  return `PRJ-${project.value.updatedAt.slice(0, 10)}-${project.value.id.padStart(4, '0')}`
})

const progressPercent = computed(() => {
  if (!project.value?.taskTotal) return 0
  return Math.round((project.value.taskDone / project.value.taskTotal) * 100)
})

const metricCards = computed<MetricCard[]>(() => [
  {
    key: 'mention',
    title: '品牌提及率',
    value: '42.3%',
    delta: '+4.3pp',
    compare: '对比上次 38.0%（2024-05-01）',
    color: t.value.colorPrimary,
    trend: 82,
  },
  {
    key: 'recommend',
    title: '推荐率',
    value: '22.4%',
    delta: '+3.1pp',
    compare: '对比上次 19.3%（2024-05-01）',
    color: t.value.colorSuccess,
    trend: 68,
  },
  {
    key: 'rank',
    title: '平均排名',
    value: '2.8',
    delta: '+0.4',
    compare: '对比上次 3.2（2024-05-01）',
    color: t.value.colorWarning,
    trend: 74,
  },
])

const platformRows = computed(() => platformStore.getForProject(projectId.value))
const selectedPlatforms = computed(() => platformRows.value.filter((item) => item.checked))

// ── 平台管理 Drawer ──
const platformDrawer = ref(false)

function togglePlatform(platformId: string) {
  platformStore.toggleProjectPlatform(projectId.value, platformId)
}

function goToPlatformSettings() {
  platformDrawer.value = false
  router.push({ name: 'Settings', params: { section: 'platforms' } })
}

const competitorRows = computed<CompetitorRow[]>(() => [
  {
    key: '1',
    rank: 1,
    brand: 'AcmeCloud',
    tag: '目标品牌',
    type: 'B2B SaaS',
    mentionRate: '42.3%',
    mentionDelta: '+4.3pp',
    recommendRate: '22.4%',
    recommendDelta: '+3.1pp',
    avgRank: '2.8',
    avgRankDelta: '+0.4',
    rankChange: '↑ 1',
    trend: 84,
  },
  {
    key: '2',
    rank: 2,
    brand: 'Salesforce',
    type: 'B2B SaaS',
    mentionRate: '61.7%',
    mentionDelta: '+2.8pp',
    recommendRate: '32.1%',
    recommendDelta: '+1.6pp',
    avgRank: '1.8',
    avgRankDelta: '—',
    rankChange: '—',
    trend: 79,
  },
  {
    key: '3',
    rank: 3,
    brand: 'Microsoft Dynamics 365',
    type: 'B2B SaaS',
    mentionRate: '50.2%',
    mentionDelta: '+2.4pp',
    recommendRate: '24.1%',
    recommendDelta: '+0.9pp',
    avgRank: '2.4',
    avgRankDelta: '—',
    rankChange: '↑ 1',
    trend: 75,
  },
  {
    key: '4',
    rank: 4,
    brand: 'Zoho CRM',
    type: 'B2B SaaS',
    mentionRate: '36.1%',
    mentionDelta: '+1.5pp',
    recommendRate: '18.3%',
    recommendDelta: '+0.7pp',
    avgRank: '3.6',
    avgRankDelta: '—',
    rankChange: '↓ 1',
    trend: 61,
  },
  {
    key: '5',
    rank: 5,
    brand: '金蝶云·星瀚',
    type: 'B2B SaaS',
    mentionRate: '28.7%',
    mentionDelta: '+0.8pp',
    recommendRate: '10.1%',
    recommendDelta: '+0.3pp',
    avgRank: '3.9',
    avgRankDelta: '—',
    rankChange: '—',
    trend: 54,
  },
])

const insightRows = computed<InsightRow[]>(() => [
  {
    id: '1',
    level: '机会',
    title: '在 “CRM 系统选型” 相关问题中提及率提升',
    description: '相比上次诊断，AcmeCloud 在该类问题中提及表现提升 6.2pp，主要来自 DeepSeek 与 Kimi 平台。',
    time: '12:20',
  },
  {
    id: '2',
    level: '风险',
    title: '推荐率在 “价格对比” 场景下下降',
    description: '在价格敏感类问题中，推荐率下降 2.1pp，建议补强 ROI 与总拥有成本表达。',
    time: '11:45',
  },
  {
    id: '3',
    level: '机会',
    title: 'ChatGPT 平台排名稳定提升',
    description: '近 7 天平均排名提升 0.6 名，建议继续优化结构化内容与信源引用。',
    time: '10:30',
  },
])

const relationPoints = computed<RelationPoint[]>(() => [
  { name: 'Salesforce', x: '78%', y: '16%', color: t.value.colorPrimary },
  { name: 'Microsoft Dynamics 365', x: '66%', y: '28%', color: t.value.colorSuccess },
  { name: 'AcmeCloud', x: '52%', y: '58%', color: t.value.colorPrimary },
  { name: 'Zoho CRM', x: '36%', y: '74%', color: t.value.colorTextSecondary },
  { name: '金蝶云·星瀚', x: '14%', y: '68%', color: t.value.colorWarning },
])

const tableColumns = [
  { title: '', dataIndex: 'rank', key: 'rank', width: 56 },
  { title: '品牌', dataIndex: 'brand', key: 'brand', width: 220 },
  { title: '品牌类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '品牌提及率', dataIndex: 'mentionRate', key: 'mentionRate', width: 120 },
  { title: '推荐率', dataIndex: 'recommendRate', key: 'recommendRate', width: 120 },
  { title: '平均排名', dataIndex: 'avgRank', key: 'avgRank', width: 110 },
  { title: '排名变化', dataIndex: 'rankChange', key: 'rankChange', width: 90 },
  { title: '趋势（7天）', dataIndex: 'trend', key: 'trend', width: 120 },
  { title: '操作', key: 'action', width: 72 },
]

function goToReport() {
  router.push({ name: 'ProjectReport', params: { id: projectId.value } })
}

function showSoon(label: string) {
  message.info(`${label}功能开发中`)
}

function rankTagColor(rank: number) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'blue'
  if (rank === 3) return 'orange'
  return 'default'
}

function trendBarStyle(value: number, color: string) {
  return {
    width: `${value}%`,
    background: color,
  }
}

function pointStyle(point: RelationPoint) {
  return {
    left: point.x,
    top: point.y,
    borderColor: point.color,
    color: point.color,
  }
}
</script>

<template>
  <div v-if="project" class="overview" :style="{ '--insight-border': t.colorBorderSecondary }">


    <a-row :gutter="[16,16]">
      <a-col :xs="24" :lg="18">
        <a-row :gutter="[16,16]">
          <a-col :xs="24" :lg="24">
            <a-card size="small" :style="{ borderColor: t.colorBorderSecondary }">
              <div class="hero-card">
                <div class="hero-main">

                  <div class="hero-copy">
                    <div class="title-row">
                      <h2 :style="{ color: t.colorText }">{{ project.name }}</h2>
                      <a-tag color="blue">{{ typeMap[project.type] }}</a-tag>
                    </div>

                    <p :style="{ color: t.colorTextSecondary }" class="hero-desc">
                      {{ project.description }}
                    </p>

                    <div class="meta-grid">
                      <div class="meta-item">
                        <span :style="{ color: t.colorTextTertiary }">项目编号</span>
                        <strong :style="{ color: t.colorText }">{{ projectCode }}</strong>
                      </div>
                      <div class="meta-item">
                        <span :style="{ color: t.colorTextTertiary }">创建时间</span>
                        <strong :style="{ color: t.colorText }">{{ project.updatedAt }}</strong>
                      </div>
                      <div class="meta-item">
                        <span :style="{ color: t.colorTextTertiary }">最近更新</span>
                        <strong :style="{ color: t.colorText }">{{ project.updatedAt }}</strong>
                      </div>
                      <div class="meta-item">
                        <span :style="{ color: t.colorTextTertiary }">负责人</span>
                        <strong :style="{ color: t.colorText }">{{ project.owner }}</strong>
                      </div>
                      <div class="meta-item">
                        <span :style="{ color: t.colorTextTertiary }">项目状态</span>
                        <a-tag :color="statusMap[project.status].color">{{ statusMap[project.status].label }}</a-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="hero-progress">
                  <a-progress
                      type="circle"
                      :percent="progressPercent"
                      :width="112"
                      :stroke-color="{ '0%': t.colorSuccess, '100%': t.colorPrimary }"
                  >
                    <template #format>
                      <div class="progress-copy">
                        <strong>{{ progressPercent }}%</strong>
                        <span>诊断完成</span>
                      </div>
                    </template>
                  </a-progress>
                </div>
              </div>
            </a-card>
          </a-col>

          <a-col :span="24">
            <a-card size="small" :style="{ borderColor: t.colorBorderSecondary }">
              <div class="platform-strip">
                <span :style="{ color: t.colorTextTertiary }">覆盖 AI 平台</span>
                <a-tag v-for="item in selectedPlatforms" :key="item.id" :style="softTagStyle(item.color)">{{ item.name }}</a-tag>
                <a-button type="link" size="small" class="inline-link" @click="platformDrawer = true">
                  管理平台
                </a-button>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-col>
      <a-col :xs="24" :lg="6">
        <a-card size="small" :style="{ borderColor: t.colorBorderSecondary }">
          <div class="action-list">
            <a-button type="primary" block @click="goToReport" :icon="h(FileText, { size: 16 })">
              查看报告
            </a-button>
            <a-button block @click="showSoon('导出报告')" :icon="h(Download, { size: 16 })">
              导出报告
            </a-button>
            <a-button block @click="showSoon('分享项目')" :icon="h(Share2, { size: 16 })">
              分享项目
            </a-button>
            <a-button block @click="showSoon('复制项目')" :icon="h(Copy, { size: 16 })">
              复制项目
            </a-button>
            <a-button block @click="showSoon('更多操作')" :icon="h(MoreHorizontal, { size: 16 })">
              更多
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :xl="18">
        <div class="main-column">
          <a-row :gutter="[16, 16]">
            <a-col v-for="card in metricCards" :key="card.key" :xs="24" :md="8">
              <a-card size="small" :style="{ borderColor: t.colorBorderSecondary }">
                <div class="metric-card">
                  <div class="metric-head">
                    <span :style="{ color: t.colorTextSecondary }">{{ card.title }}</span>
                    <CircleHelp :size="14" :color="t.colorTextTertiary" />
                  </div>

                  <div class="metric-value-row">
                    <strong :style="{ color: t.colorText }">{{ card.value }}</strong>
                    <span :style="{ color: card.color }">{{ card.delta }}</span>
                  </div>

                  <div :style="{ color: t.colorTextTertiary }" class="metric-compare">{{ card.compare }}</div>

                  <div class="metric-trend-track" :style="{ background: t.colorFillQuaternary }">
                    <div class="metric-trend-bar" :style="trendBarStyle(card.trend, card.color)" />
                  </div>
                </div>
              </a-card>
            </a-col>

            <a-col :span="24">
              <a-card size="small" title="竞品表现对比" :style="{ borderColor: t.colorBorderSecondary }">
                <a-table
                  :columns="tableColumns"
                  :data-source="competitorRows"
                  :pagination="false"
                  row-key="key"
                  size="small"
                  :scroll="{ x: 980 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'rank'">
                      <a-tag :color="rankTagColor(record.rank)">{{ record.rank }}</a-tag>
                    </template>

                    <template v-else-if="column.key === 'brand'">
                      <div class="brand-cell">
                        <span :style="{ color: t.colorText }">{{ record.brand }}</span>
                        <a-tag v-if="record.tag" color="blue">{{ record.tag }}</a-tag>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'mentionRate'">
                      <div class="number-cell">
                        <span>{{ record.mentionRate }}</span>
                        <span :style="{ color: t.colorSuccess }">{{ record.mentionDelta }}</span>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'recommendRate'">
                      <div class="number-cell">
                        <span>{{ record.recommendRate }}</span>
                        <span :style="{ color: t.colorSuccess }">{{ record.recommendDelta }}</span>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'avgRank'">
                      <div class="number-cell">
                        <span>{{ record.avgRank }}</span>
                        <span :style="{ color: t.colorSuccess }">{{ record.avgRankDelta }}</span>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'rankChange'">
                      <span
                        :style="{
                          color:
                            record.rankChange.includes('↑')
                              ? t.colorSuccess
                              : record.rankChange.includes('↓')
                                ? t.colorError
                                : t.colorTextTertiary,
                        }"
                      >
                        {{ record.rankChange }}
                      </span>
                    </template>

                    <template v-else-if="column.key === 'trend'">
                      <div class="table-trend-track" :style="{ background: t.colorFillQuaternary }">
                        <div class="table-trend-bar" :style="trendBarStyle(record.trend, t.colorPrimary)" />
                      </div>
                    </template>

                    <template v-else-if="column.key === 'action'">
                      <a-button type="text" size="small" @click="showSoon('竞品详情')">
                        <MoreHorizontal :size="16" />
                      </a-button>
                    </template>
                  </template>
                </a-table>
              </a-card>
            </a-col>

            <a-col :span="24">
              <a-card size="small" title="竞品关系定位" :style="{ borderColor: t.colorBorderSecondary }">
                <div class="relation-layout">
                  <div class="relation-graph" :style="{ background: t.colorFillQuaternary, borderColor: t.colorBorderSecondary }">
                    <div class="axis horizontal" :style="{ background: t.colorBorderSecondary }" />
                    <div class="axis vertical" :style="{ background: t.colorBorderSecondary }" />

                    <span class="axis-label top" :style="{ color: t.colorTextTertiary }">高推荐率</span>
                    <span class="axis-label right" :style="{ color: t.colorTextTertiary }">高提及率</span>
                    <span class="axis-label bottom" :style="{ color: t.colorTextTertiary }">低推荐率</span>
                    <span class="axis-label left" :style="{ color: t.colorTextTertiary }">低提及率</span>

                    <div
                      v-for="item in relationPoints"
                      :key="item.name"
                      class="relation-point"
                      :style="pointStyle(item)"
                    >
                      <span class="point-dot" :style="{ background: item.color }" />
                      <span>{{ item.name }}</span>
                    </div>
                  </div>

                  <div class="relation-copy">
                    <h4 :style="{ color: t.colorText }">关系洞察</h4>
                    <ul :style="{ color: t.colorTextSecondary }">
                      <li>Salesforce 在提及率和推荐率上均处于领先位置，AI 认知势能最强。</li>
                      <li>Microsoft Dynamics 365 与 AcmeCloud 处于高提及率赛道，建议强化差异化价值表达。</li>
                      <li>Zoho CRM 与金蝶云·星瀚处于低提及低推荐区域，存在认知突破空间。</li>
                    </ul>

                    <a-button type="link" class="inline-link" @click="showSoon('详细洞察')">
                      查看详细洞察
                      <ChevronRight :size="14" />
                    </a-button>
                  </div>
                </div>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </a-col>

      <a-col :xs="24" :xl="6">
        <div class="side-column">
          <a-card size="small" title="AI 平台选择" :style="{ borderColor: t.colorBorderSecondary }">
            <div class="side-summary" :style="{ color: t.colorTextSecondary }">
              <span>已选 {{ selectedPlatforms.length }} / {{ platformRows.length }}</span>
              <span>覆盖量（%）</span>
            </div>

            <div class="side-list">
              <div
                v-for="item in platformRows"
                :key="item.id"
                class="side-row"
                :style="{ cursor: 'pointer' }"
                @click="togglePlatform(item.id)"
              >
                <div class="platform-name">
                  <span
                    class="check-dot"
                    :style="{
                      background: item.checked ? t.colorPrimary : 'transparent',
                      borderColor: item.checked ? t.colorPrimary : t.colorBorder,
                    }"
                  />
                  <span :style="{ color: t.colorText }">{{ item.name }}</span>
                </div>
                <span :style="{ color: t.colorTextSecondary }">{{ item.coverage }}</span>
              </div>
            </div>
          </a-card>

          <a-card size="small" title="最近洞察" :style="{ borderColor: t.colorBorderSecondary }">
            <div class="insight-list">
              <div v-for="item in insightRows" :key="item.id" class="insight-item">
                <div class="insight-head">
                  <a-tag :color="item.level === '风险' ? 'orange' : 'green'">{{ item.level }}</a-tag>
                  <span :style="{ color: t.colorTextTertiary }">{{ item.time }}</span>
                </div>
                <div :style="{ color: t.colorText }" class="insight-title">{{ item.title }}</div>
                <div :style="{ color: t.colorTextSecondary }" class="insight-desc">{{ item.description }}</div>
              </div>
            </div>
          </a-card>

          <a-card size="small" title="基准对比" :style="{ borderColor: t.colorBorderSecondary }">
            <div class="benchmark-list">
              <div class="benchmark-row">
                <span :style="{ color: t.colorTextTertiary }">所属行业</span>
                <strong :style="{ color: t.colorText }">{{ project.industry }}</strong>
              </div>
              <div class="benchmark-row">
                <span :style="{ color: t.colorTextTertiary }">对比基准</span>
                <strong :style="{ color: t.colorText }">行业 Top 10%</strong>
              </div>
              <div class="benchmark-row">
                <span :style="{ color: t.colorTextTertiary }">数据时间</span>
                <strong :style="{ color: t.colorText }">{{ project.updatedAt.slice(0, 10) }}</strong>
              </div>
            </div>

            <a-button block @click="showSoon('调整基准设置')" :icon="h(Settings2, { size: 16 })">
              调整基准设置
            </a-button>
          </a-card>
        </div>
      </a-col>
    </a-row>

    <!-- ═══ 平台管理 Drawer ═══ -->
    <a-drawer
      v-model:open="platformDrawer"
      title="管理 AI 平台"
      :width="420"
      placement="right"
    >
      <div class="platform-drawer-list">
        <div
          v-for="item in platformRows"
          :key="item.id"
          class="platform-drawer-row"
          :style="{ borderColor: t.colorBorderSecondary }"
          @click="togglePlatform(item.id)"
        >
          <span
            class="check-dot"
            :style="{
              background: item.checked ? t.colorPrimary : 'transparent',
              borderColor: item.checked ? t.colorPrimary : t.colorBorder,
            }"
          />
          <span :style="{ color: t.colorText, flex: 1 }">{{ item.name }}</span>
          <span :style="{ color: t.colorTextSecondary, fontSize: '12px' }">覆盖率 {{ item.coverage }}</span>
        </div>
      </div>

      <div class="platform-drawer-actions" :style="{ borderColor: t.colorBorderSecondary }">
        <a-button size="small" @click="platformStore.selectAll(projectId)">
          全选
        </a-button>
        <a-button size="small" @click="platformStore.deselectAll(projectId)">
          取消全选
        </a-button>
      </div>

      <a-divider />

      <a-button block @click="goToPlatformSettings">
        前往系统设置管理平台
      </a-button>
    </a-drawer>
  </div>

  <a-empty v-else description="项目不存在" />
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hero-main {
  display: flex;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.title-row h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.hero-desc {
  margin: 0 0 16px;
  line-height: 1.7;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item :deep(.ant-tag) {
  align-self: flex-start;
}

.hero-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 128px;
}

.progress-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.progress-copy strong {
  font-size: 26px;
  line-height: 1;
}

.progress-copy span {
  font-size: 12px;
}

.action-list,
.insight-list,
.side-list,
.benchmark-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.platform-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.inline-link {
  padding-left: 0;
}

.side-summary,
.side-row,
.benchmark-row,
.insight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.platform-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.check-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid;
  flex-shrink: 0;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.metric-value-row strong {
  font-size: 30px;
  line-height: 1;
}

.metric-compare {
  font-size: 12px;
}

.metric-trend-track,
.table-trend-track {
  width: 100%;
  border-radius: 999px;
  overflow: hidden;
}

.metric-trend-track {
  height: 8px;
}

.table-trend-track {
  height: 6px;
}

.metric-trend-bar,
.table-trend-bar {
  height: 100%;
  border-radius: inherit;
}

.brand-cell,
.number-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.insight-item {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--insight-border);
}

.insight-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.insight-title {
  font-weight: 600;
  margin: 6px 0;
  line-height: 1.6;
}

.insight-desc {
  font-size: 13px;
  line-height: 1.7;
}

.relation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(240px, 1fr);
  gap: 16px;
}

.relation-graph {
  position: relative;
  min-height: 300px;
  border: 1px solid;
  border-radius: 12px;
}

.axis {
  position: absolute;
}

.axis.horizontal {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}

.axis.vertical {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

.axis-label {
  position: absolute;
  font-size: 12px;
}

.axis-label.top {
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.axis-label.right {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.axis-label.bottom {
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.axis-label.left {
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.relation-point {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  font-size: 13px;
}

.point-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.relation-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relation-copy h4 {
  margin: 0;
}

.relation-copy ul {
  margin: 0;
  padding-left: 18px;
  line-height: 1.8;
}

/* ── 平台管理 Drawer ── */
.platform-drawer-list {
  display: flex;
  flex-direction: column;
}

.platform-drawer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid;
  cursor: pointer;
}

.platform-drawer-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid;
}

@media (max-width: 1200px) {
  .meta-grid,
  .relation-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .hero-card,
  .hero-main {
    flex-direction: column;
  }

  .hero-progress {
    justify-content: flex-start;
  }
}
</style>
