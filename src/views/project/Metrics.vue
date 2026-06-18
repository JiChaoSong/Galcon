<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { theme } from 'ant-design-vue'
import { useTaskStore } from '@/stores/task'

const route = useRoute()
const projectId = route.params.id as string
const store = useTaskStore()
const { token: t } = theme.useToken()

onMounted(() => {
  store.fetchBatches(projectId)
})

// ── 当前项目的分析数据 ──
const analyses = computed(() => {
  const taskIds = new Set(
    store.tasks.filter((t) => t.projectId === projectId).map((t) => t.id),
  )
  return store.analyses.filter((a) => taskIds.has(a.taskId))
})

// ── 按品牌分组计算指标 ──
interface BrandMetrics {
  brandName: string
  mentionRate: number
  recommendRate: number
  avgPosition: number
  competitorShare: number
  platformCoverage: number
  queryCoverage: number
  accuracyRate: number
  citationRate: number
  riskRate: number
  totalTests: number
}

const brandMetrics = computed<BrandMetrics[]>(() => {
  const brands = new Set(store.tasks.filter((t) => t.projectId === projectId).map((t) => t.brandName))
  const results: BrandMetrics[] = []

  for (const brandName of brands) {
    const brandTasks = store.tasks.filter((t) => t.brandName === brandName && t.projectId === projectId)
    const brandAnalyses = analyses.value.filter((a) => brandTasks.some((t) => t.id === a.taskId))
    const total = brandAnalyses.length || 1

    const mentioned = brandAnalyses.filter((a) => a.targetBrandMentioned).length
    const recommended = brandAnalyses.filter((a) => a.targetBrandRecommended).length
    const withPosition = brandAnalyses.filter((a) => a.targetBrandRank > 0)
    const avgPos = withPosition.length ? withPosition.reduce((s, a) => s + a.targetBrandRank, 0) / withPosition.length : 0
    const withCompetitors = brandAnalyses.filter((a) => a.competitorsMentioned.length > 0).length
    const accurate = brandAnalyses.filter((a) => a.accuracyStatus === 'accurate').length
    const withCitation = brandAnalyses.filter((a) => a.citationSources.length > 0).length
    const withRisk = brandAnalyses.filter((a) => a.riskTypes.length > 0).length

    // 平台覆盖率
    const platforms = new Set(store.tasks.filter((t) => t.brandName === brandName && t.projectId === projectId).map((t) => t.platformId))
    const platformsWithMention = new Set()
    brandAnalyses.filter((a) => a.targetBrandMentioned).forEach((a) => {
      const t = store.tasks.find((t) => t.id === a.taskId)
      if (t) platformsWithMention.add(t.platformId)
    })

    // 问题覆盖率
    const questions = new Set(store.tasks.filter((t) => t.brandName === brandName && t.projectId === projectId).map((t) => t.questionId))
    const questionsWithMention = new Set()
    brandAnalyses.filter((a) => a.targetBrandMentioned).forEach((a) => {
      const t = store.tasks.find((t) => t.id === a.taskId)
      if (t) questionsWithMention.add(t.questionId)
    })

    results.push({
      brandName,
      mentionRate: Math.round((mentioned / total) * 100),
      recommendRate: Math.round((recommended / total) * 100),
      avgPosition: Math.round(avgPos * 10) / 10,
      competitorShare: Math.round((withCompetitors / total) * 100),
      platformCoverage: platforms.size ? Math.round((platformsWithMention.size / platforms.size) * 100) : 0,
      queryCoverage: questions.size ? Math.round((questionsWithMention.size / questions.size) * 100) : 0,
      accuracyRate: Math.round((accurate / (mentioned || 1)) * 100),
      citationRate: Math.round((withCitation / total) * 100),
      riskRate: Math.round((withRisk / total) * 100),
      totalTests: total,
    })
  }
  return results
})

// ── 总体指标 ──
const overall = computed(() => {
  const total = analyses.value.length || 1
  const mentioned = analyses.value.filter((a) => a.targetBrandMentioned).length
  const recommended = analyses.value.filter((a) => a.targetBrandRecommended).length
  const withCompetitors = analyses.value.filter((a) => a.competitorsMentioned.length > 0).length
  const accurate = analyses.value.filter((a) => a.accuracyStatus === 'accurate').length
  const withCitation = analyses.value.filter((a) => a.citationSources.length > 0).length
  const withRisk = analyses.value.filter((a) => a.riskTypes.length > 0).length

  return {
    mentionRate: Math.round((mentioned / total) * 100),
    recommendRate: Math.round((recommended / total) * 100),
    competitorShare: Math.round((withCompetitors / total) * 100),
    accuracyRate: Math.round((accurate / (mentioned || 1)) * 100),
    citationRate: Math.round((withCitation / total) * 100),
    riskRate: Math.round((withRisk / total) * 100),
    total,
  }
})
</script>

<template>
  <div class="metrics-page">
    <h2 :style="{ color: t.colorText, margin: '0 0 16px' }">指标分析</h2>

    <!-- 总体概览卡片 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="12" :sm="8" :lg="4">
        <a-card size="small" :style="{ background: t.colorFillQuaternary }">
          <a-statistic title="品牌提及率" :value="overall.mentionRate" suffix="%" :value-style="{ color: t.colorPrimary }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :lg="4">
        <a-card size="small" :style="{ background: t.colorFillQuaternary }">
          <a-statistic title="推荐率" :value="overall.recommendRate" suffix="%" :value-style="{ color: t.colorSuccess }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :lg="4">
        <a-card size="small" :style="{ background: t.colorFillQuaternary }">
          <a-statistic title="竞品出现率" :value="overall.competitorShare" suffix="%" :value-style="{ color: t.colorWarning }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :lg="4">
        <a-card size="small" :style="{ background: t.colorFillQuaternary }">
          <a-statistic title="描述准确率" :value="overall.accuracyRate" suffix="%" :value-style="{ color: t.colorPrimary }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :lg="4">
        <a-card size="small" :style="{ background: t.colorFillQuaternary }">
          <a-statistic title="引用率" :value="overall.citationRate" suffix="%" :value-style="{ color: t.colorSuccess }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :lg="4">
        <a-card size="small" :style="{ background: t.colorFillQuaternary }">
          <a-statistic title="风险率" :value="overall.riskRate" suffix="%" :value-style="{ color: t.colorError }" />
        </a-card>
      </a-col>
    </a-row>

    <a-divider />

    <!-- 按品牌分指标 -->
    <h3 :style="{ color: t.colorText, margin: '0 0 12px' }">按品牌查看</h3>
    <a-table
      :columns="[
        { title: '品牌', dataIndex: 'brandName', key: 'brand', width: 120 },
        { title: '提及率', dataIndex: 'mentionRate', key: 'mentionRate', width: 90, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '推荐率', dataIndex: 'recommendRate', key: 'recommendRate', width: 90, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '平均位置', dataIndex: 'avgPosition', key: 'avgPosition', width: 100, customRender: ({ text }: { text: number }) => text || '-' },
        { title: '竞品出现率', dataIndex: 'competitorShare', key: 'competitorShare', width: 110, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '平台覆盖率', dataIndex: 'platformCoverage', key: 'platformCoverage', width: 100, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '问题覆盖率', dataIndex: 'queryCoverage', key: 'queryCoverage', width: 100, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '准确率', dataIndex: 'accuracyRate', key: 'accuracyRate', width: 90, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '引用率', dataIndex: 'citationRate', key: 'citationRate', width: 90, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '风险率', dataIndex: 'riskRate', key: 'riskRate', width: 90, customRender: ({ text }: { text: number }) => text + '%' },
        { title: '测试数', dataIndex: 'totalTests', key: 'totalTests', width: 80 },
      ]"
      :data-source="brandMetrics"
      :pagination="false"
      row-key="brandName"
      size="middle"
      :scroll="{ x: 1000 }"
    />

    <!-- 指标说明 -->
    <a-divider />
    <a-collapse :bordered="false" :style="{ background: t.colorFillQuaternary }">
      <a-collapse-panel key="1" header="指标说明（PRD 7.8）">
        <a-descriptions :column="1" size="small">
          <a-descriptions-item label="品牌提及率 Brand Mention Rate">目标品牌被提及次数 / 总测试次数</a-descriptions-item>
          <a-descriptions-item label="推荐率 Recommendation Rate">目标品牌被主动推荐次数 / 总测试次数</a-descriptions-item>
          <a-descriptions-item label="平均出现位置 Average Position">目标品牌在推荐列表中的平均位置</a-descriptions-item>
          <a-descriptions-item label="竞品出现率 Competitor Share">竞品出现次数 / 总测试次数</a-descriptions-item>
          <a-descriptions-item label="平台覆盖率 Platform Coverage">出现目标品牌的平台数 / 总平台数</a-descriptions-item>
          <a-descriptions-item label="问题覆盖率 Query Coverage">出现目标品牌的问题类型覆盖情况</a-descriptions-item>
          <a-descriptions-item label="描述准确率 Answer Accuracy">准确描述次数 / 被提及次数</a-descriptions-item>
          <a-descriptions-item label="引用率 Citation Rate">有引用来源的回答次数 / 总回答次数</a-descriptions-item>
          <a-descriptions-item label="风险率 Risk Rate">存在错误/负面/过时等风险的回答次数 / 总回答次数</a-descriptions-item>
        </a-descriptions>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<style scoped>
.metrics-page {
  display: flex;
  flex-direction: column;
}
</style>
