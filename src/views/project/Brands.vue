<script setup lang="ts">
import { computed, h, reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { Plus } from '@lucide/vue'
import { useProjectStore } from '@/stores/project'
import { useBrandStore } from '@/stores/brand'
import type { Competitor } from '@/stores/brand'
import { useTokenMeta } from '@/composables/useTokenMeta'
import { softTagStyle } from '@/composables/useTagStyle'

interface CompetitorRow {
  key: string
  name: string
  relation: string
  mentionRate: string
  recommendationRate: string
  avgRank: string
  riskLevel: string
}

const route = useRoute()
const projectStore = useProjectStore()
const brandStore = useBrandStore()
const t = useTokenMeta()
const projectId = route.params.id as string

const primaryBrand = computed(() => brandStore.brands[0] ?? null)
const competitorList = computed(() => brandStore.competitors.filter(c => c.brandId === primaryBrand.value?.id))

// ── 概览卡（从第一个品牌取数据） ──
const overview = computed(() => {
  const b = primaryBrand.value
  if (!b) return null
  return {
    brandName: b.name,
    intro: b.intro ?? '',
    website: b.website ?? '',
    mentionRate: '--',
    mentionDelta: '--',
    recommendationRate: '--',
    recommendationDelta: '--',
    depthScore: '--',
    depthState: '待测试',
    depthPercent: 0,
  }
})

// ── 竞品表格 ──
const competitorRows = computed<CompetitorRow[]>(() => {
  const rows: CompetitorRow[] = []

  // 首行：主品牌
  if (primaryBrand.value) {
    rows.push({
      key: primaryBrand.value.id,
      name: primaryBrand.value.name,
      relation: '主品牌',
      mentionRate: '--',
      recommendationRate: '--',
      avgRank: '--',
      riskLevel: '低',
    })
  }

  // 竞品行
  competitorList.value.forEach((c) => {
    rows.push({
      key: c.id,
      name: c.competitorName,
      relation: c.type === 'direct' ? '直接竞品' : c.type === 'international' ? '国际竞品' : c.type === 'indirect' ? '间接竞品' : '替代方案',
      mentionRate: '--',
      recommendationRate: '--',
      avgRank: '--',
      riskLevel: c.priority === 'high' ? '高' : c.priority === 'medium' ? '中' : '低',
    })
  })

  return rows
})

onMounted(() => {
  brandStore.fetchBrands(projectId)
  if (!projectStore.current) {
    projectStore.fetchProject(projectId)
  }
})

// ── 竞品新增 Drawer ──
const competitorDrawer = ref(false)
const compForm = reactive({
  competitorName: '',
  type: 'direct' as Competitor['type'],
  priority: 'medium' as Competitor['priority'],
  notes: '',
})

function openAddCompetitor() {
  Object.assign(compForm, { competitorName: '', type: 'direct', priority: 'medium', notes: '' })
  competitorDrawer.value = true
}

function handleCompSubmit() {
  const name = compForm.competitorName.trim()
  if (!name) { message.warning('请输入竞品名称'); return }
  const brandId = primaryBrand.value?.id
  if (!brandId) { message.warning('请先添加品牌'); return }
  brandStore.addCompetitor(projectId, brandId, {
    competitorName: name,
    type: compForm.type,
    priority: compForm.priority,
    notes: compForm.notes,
  })
  message.success(`竞品「${name}」已添加`)
  competitorDrawer.value = false
}

const competitorColumns: TableColumnsType<CompetitorRow> = [
  { title: '竞品', dataIndex: 'name', key: 'name', width: 220 },
  { title: '品牌关系', dataIndex: 'relation', key: 'relation', width: 110 },
  { title: '提及率', dataIndex: 'mentionRate', key: 'mentionRate', width: 100 },
  { title: '推荐率', dataIndex: 'recommendationRate', key: 'recommendationRate', width: 100 },
  { title: '平均总排名', dataIndex: 'avgRank', key: 'avgRank', width: 110 },
  { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 96 },
]

function relationTagStyle(relation: string) {
  switch (relation) {
    case '主品牌': return softTagStyle(t.value.colorQuestionBrand)
    case '直接竞品': return softTagStyle(t.value.colorQuestionCompetitor)
    case '替代方案': return softTagStyle(t.value.colorQuestionAlternative)
    case '国际竞品': return softTagStyle(t.value.colorQuestionScenario)
    case '间接竞品': return softTagStyle(t.value.colorQuestionCategory)
    default: return softTagStyle(t.value.colorTextSecondary)
  }
}

function riskTagStyle(level: string) {
  if (level === '高') return softTagStyle(t.value.colorQuestionRisk)
  return softTagStyle(t.value.colorQuestionCategory)
}


</script>

<template>
  <div class="brands-page">

    <a-row :gutter="[20, 20]">
      <a-col :xs="24" :xl="24">
        <a-card class="section-card overview-card" :bordered="true">
          <template #title>
            <span class="section-title">项目概览</span>
          </template>

          <div v-if="overview" class="overview-grid">
            <div class="brand-card">
              <div class="brand-header">
                <a-avatar class="brand-avatar" :size="56">{{ overview.brandName.charAt(0) }}</a-avatar>
                <div class="brand-main">
                  <div class="brand-name-row">
                    <h3>{{ overview.brandName }}</h3>
                    <a-tag class="soft-tag" :style="softTagStyle(t.colorPrimary)">主品牌</a-tag>
                  </div>
                  <p>{{ overview.intro || '暂无品牌介绍' }}</p>
                  <a v-if="overview.website" class="brand-link" :href="overview.website.startsWith('http') ? overview.website : 'https://' + overview.website" target="_blank" rel="noopener">
                    {{ overview.website }}
                  </a>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <span class="metric-label">品牌提及率</span>
              <strong>{{ overview.mentionRate }}</strong>
              <div class="metric-foot">
                <span>较上周</span>
                <span class="positive">{{ overview.mentionDelta }}</span>
              </div>
            </div>

            <div class="metric-card">
              <span class="metric-label">推荐率</span>
              <strong>{{ overview.recommendationRate }}</strong>
              <div class="metric-foot">
                <span>较上周</span>
                <span class="positive">{{ overview.recommendationDelta }}</span>
              </div>
            </div>

            <div class="metric-card metric-card-progress">
              <span class="metric-label">测试进度</span>
              <div class="depth-wrap">
                <div class="depth-copy">
                  <strong>{{ overview.depthScore }}</strong>
                </div>
                <a-progress
                  type="dashboard"
                  :percent="overview.depthPercent"
                  :show-info="false"
                  :stroke-color="t.colorSuccess"
                  :trail-color="t.colorFillSecondary"
                  :stroke-width="12"
                  :size="78"
                  :gap-degree="110"
                />
              </div>
              <div class="depth-state">{{ overview.depthState }}</div>
            </div>
          </div>
          <a-empty v-else description="还没有品牌，请在「系统设置」中为项目添加品牌" />
        </a-card>

        <a-card class="section-card table-card" :bordered="true">
          <template #title>
            <span class="section-title">竞品关系</span>
          </template>
          <template #extra>
            <a-button type="primary" :icon="h(Plus, { size: 14 })" @click="openAddCompetitor">
              新增竞品
            </a-button>
          </template>

          <a-table
            :columns="competitorColumns"
            :data-source="competitorRows"
            :loading="brandStore.loading"
            :pagination="false"
            row-key="key"
            size="middle"
            class="competitor-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'relation'">
                <a-tag class="soft-tag" :style="relationTagStyle(record.relation)">{{ record.relation }}</a-tag>
              </template>

              <template v-else-if="column.key === 'riskLevel'">
                <a-tag class="soft-tag" :style="riskTagStyle(record.riskLevel)">{{ record.riskLevel }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- ═══ 新增竞品 Drawer ═══ -->
    <a-drawer
      v-model:open="competitorDrawer"
      title="新增竞品"
      :width="420"
      placement="right"
    >
      <a-form layout="vertical">
        <a-form-item label="竞品名称" required>
          <a-input v-model:value="compForm.competitorName" placeholder="如 Salesforce" />
        </a-form-item>
        <a-form-item label="竞品类型">
          <a-select v-model:value="compForm.type" :options="[
            { label: '直接竞品', value: 'direct' },
            { label: '替代方案', value: 'alternative' },
            { label: '国际竞品', value: 'international' },
            { label: '间接竞品', value: 'indirect' },
          ]" />
        </a-form-item>
        <a-form-item label="优先级">
          <a-select v-model:value="compForm.priority" :options="[
            { label: '高', value: 'high' },
            { label: '中', value: 'medium' },
            { label: '低', value: 'low' },
          ]" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="compForm.notes" :rows="2" />
        </a-form-item>
      </a-form>

      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px">
        <a-button @click="competitorDrawer = false">取消</a-button>
        <a-button type="primary" @click="handleCompSubmit">保存</a-button>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.brands-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.breadcrumb {
  color: v-bind('t.colorTextTertiary');
  font-size: 13px;
  font-weight: 500;
}

.hero h1 {
  margin: 0;
  color: v-bind('t.colorText');
  font-size: 28px;
  line-height: 1.25;
  font-weight: 700;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 36px;
  color: v-bind('t.colorTextSecondary');
  font-size: 15px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.section-card {
  border-color: v-bind('t.colorBorderSecondary');
  background: v-bind('t.colorBgContainer');
  box-shadow: 0 12px 28px color-mix(in srgb, v-bind('t.colorText') 5%, transparent);
  margin-bottom: 10px;
}

.section-card :deep(.ant-card-head) {
  min-height: auto;
  padding: 20px 24px 0;
  border-bottom: none;
}

.section-card :deep(.ant-card-head-title) {
  padding: 0;
}

.section-card :deep(.ant-card-body) {
  padding: 20px 24px 24px;
}

.section-title {
  color: v-bind('t.colorText');
  font-size: 16px;
  font-weight: 700;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.brand-card,
.metric-card
 {
  border: 1px solid v-bind('t.colorBorderSecondary');
  background: v-bind('t.colorBgContainer');
}

.brand-card {
  padding: 22px 20px;
}

.brand-header {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.brand-avatar {
  background: v-bind('t.colorPrimary');
  color: #fff;
  font-size: 24px !important;
  font-weight: 700;
}

.brand-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.brand-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.brand-name-row h3 {
  margin: 0;
  color: v-bind('t.colorText');
  font-size: 20px;
  font-weight: 700;
}

.brand-main p {
  margin: 0;
  color: v-bind('t.colorTextSecondary');
  font-size: 15px;
  line-height: 1.6;
}

.brand-link {
  color: v-bind('t.colorPrimary');
  font-size: 15px;
  font-weight: 600;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 18px;
  min-height: 196px;
}

.metric-label {
  color: v-bind('t.colorTextSecondary');
  font-size: 14px;
  font-weight: 600;
}

.metric-card strong {
  color: v-bind('t.colorText');
  font-size: 24px;
  line-height: 1.1;
  font-weight: 700;
}

.metric-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  color: v-bind('t.colorTextTertiary');
  font-size: 13px;
}

.metric-foot .positive,
.depth-state {
  color: v-bind('t.colorSuccess');
  font-weight: 600;
}

.metric-card-progress {
  align-items: stretch;
}

.depth-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.depth-copy {
  display: flex;
  align-items: flex-start;
  gap: 3px;
}

.depth-copy strong {
  font-size: 38px;
}

.table-card :deep(.ant-card-body) {
  padding-top: 14px;
}

.competitor-table :deep(.ant-table) {
  background: transparent;
}

.competitor-table :deep(.ant-table-thead > tr > th) {
  color: v-bind('t.colorTextSecondary');
  background: v-bind('t.colorFillQuaternary');
  font-size: 13px;
  font-weight: 600;
}

.competitor-table :deep(.ant-table-tbody > tr > td) {
  color: v-bind('t.colorText');
  font-size: 14px;
}

.sidebar-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.platform-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.platform-item.active {
  border-color: color-mix(in srgb, v-bind('t.colorPrimary') 35%, v-bind('t.colorBgContainer'));
  box-shadow: inset 0 0 0 2px color-mix(in srgb, v-bind('t.colorPrimary') 18%, v-bind('t.colorBgContainer'));
  background: color-mix(in srgb, v-bind('t.colorPrimary') 6%, v-bind('t.colorBgContainer'));
}

.platform-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platform-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  flex-shrink: 0;
}

.platform-name {
  color: v-bind('t.colorText');
  font-size: 15px;
  font-weight: 600;
}

.progress-stats {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.progress-row,
.progress-rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: v-bind('t.colorTextSecondary');
  font-size: 15px;
}

.progress-row strong,
.progress-rate-row strong {
  color: v-bind('t.colorText');
  font-size: 16px;
  font-weight: 700;
}

.progress-link {
  margin-top: 18px;
  padding: 0;
  justify-content: center;
  color: v-bind('t.colorPrimary');
  font-weight: 600;
}

@media (max-width: 1400px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 992px) {
  .hero {
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .hero-meta {
    gap: 14px 20px;
    flex-direction: column;
  }

  .hero-actions {
    flex-direction: column;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
