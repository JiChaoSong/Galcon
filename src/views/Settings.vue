<script setup lang="ts">
import { computed, markRaw, h, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { theme } from 'ant-design-vue'
import { Monitor, Building2, Gauge, FileText, Tags } from '@lucide/vue'
import PlatformSection from '@/views/settings/PlatformSection.vue'

const route = useRoute()
const router = useRouter()
const { token: t } = theme.useToken()

// ── section 注册表（新增 section 只需加一项） ──
interface Section {
  key: string
  label: string
  icon: unknown
  component: unknown
}
const sections: Section[] = [
  { key: 'platforms', label: 'AI 平台', icon: markRaw(Monitor), component: markRaw(PlatformSection) },
  { key: 'industries', label: '行业管理', icon: markRaw(Building2), component: null },
  { key: 'question-types', label: '问题类型', icon: markRaw(Tags), component: null },
  { key: 'metrics', label: '指标定义', icon: markRaw(Gauge), component: null },
  { key: 'templates', label: '报告模板', icon: markRaw(FileText), component: null },
]

const currentSection = computed(() => route.params.section as string | undefined)
const activeComponent = computed(() => sections.find(s => s.key === currentSection.value)?.component ?? null)

// 无 section 时默认跳 platforms
watch(currentSection, (val) => {
  if (!val) router.replace({ name: 'Settings', params: { section: 'platforms' } })
}, { immediate: true })

function navTo(key: string) {
  router.push({ name: 'Settings', params: { section: key } })
}

const selectedKeys = computed(() => currentSection.value ? [currentSection.value] : ['platforms'])
const menuItems = computed(() => sections.map(s => ({
  key: s.key,
  icon: () => h(s.icon as any, { size: 18 }),
  label: s.label,
})))
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h2 :style="{ color: t.colorText }">系统设置</h2>
    </div>

    <div class="settings-layout">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        :items="menuItems"
        mode="inline"
        class="settings-nav"
        @click="({ key }: { key: string }) => navTo(key)"
      />

      <div class="settings-body">
        <component v-if="activeComponent" :is="activeComponent" />
        <a-empty v-else description="该配置模块尚未开放，敬请期待" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.settings-layout {
  display: flex;
  gap: 24px;
}

.settings-nav {
  width: 180px;
  flex-shrink: 0;
  border-inline-end: none !important;
}

.settings-body {
  flex: 1;
  min-width: 0;
}
</style>
