<script setup lang="ts">
import { ref, watch, computed, h, onUnmounted, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useProjectStore } from '@/stores/project'
import { theme } from 'ant-design-vue'
import { ArrowLeft, Sun, Moon } from '@lucide/vue'
import logoSvg from '@/assets/galcon.svg'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const projectStore = useProjectStore()

const { token: t } = theme.useToken()

// ── 当前项目 ──
const projectId = computed(() => route.params.id as string)

// ── 菜单选中：用 afterEach 延迟到路由完成后再更新，避免与 RouterView 组件切换产生 DOM 竞争 ──
const selectedKeys = ref<string[]>([(route.meta?.parentMenu as string) ?? (route.name as string) ?? ''])
const removeAfterEach = router.afterEach((to) => {
  nextTick(() => {
    selectedKeys.value = [(to.meta?.parentMenu as string) ?? (to.name as string) ?? '']
  })
})
onUnmounted(() => removeAfterEach())

// ── 从路由配置生成菜单项（有 parentMenu 的为子页面，不显示在菜单中） ──
const menuItems = computed(() => {
  const projectRoute = router.options.routes.find((r) => r.path === '/projects/:id')
  if (!projectRoute?.children) return []
  return projectRoute.children
    .filter((child: RouteRecordRaw) => child.meta?.title && !child.meta?.parentMenu)
    .map((child: RouteRecordRaw) => ({
      key: child.name as string,
      label: child.meta?.title as string,
    }))
})

function handleMenuClick({ key }: { key: string }) {
  router.push({ name: key, params: { id: projectId.value } })
}

// ── 项目切换 ──
onMounted(() => {
  if (projectStore.projects.length === 0) {
    projectStore.fetchProjects()
  }
})

const projectOptions = computed(() =>
  projectStore.projects.map(p => ({ label: p.name, value: p.id })),
)

const selectedProjectId = ref(projectId.value)
watch(projectId, (val) => { selectedProjectId.value = val })

function onProjectChange(value: string) {
  if (value && value !== projectId.value) {
    router.push({ name: 'ProjectBrands', params: { id: value } })
  }
}

// ── 返回菜单 ──
function goBack() {
  router.push({ name: 'Projects' })
}

// ── 主题 ──
const isDark = computed(() => appStore.theme === 'dark')
const themeIcon = computed(() => isDark.value ? h(Sun, { size: 16 }) : h(Moon, { size: 16 }))

</script>

<template>
  <a-layout style="height: 100vh; overflow: hidden">
    <!-- 顶部水平栏 -->
    <a-layout-header
      class="project-header"
      :style="{
        background: t.colorBgContainer,
        borderBottom: isDark ? 'none' : `1px solid ${t.colorBorderSecondary}`,
      }"
    >
      <div class="project-header-inner">
        <!-- Logo -->
        <router-link :to="{ name: 'Projects' }" class="project-logo" :style="{ color: t.colorText }">
          <img :src="logoSvg" alt="Galcon" class="logo-img" />
          <span class="logo-text">Galcon</span>
        </router-link>

        <!-- 返回 + 项目切换 -->
        <div class="project-nav">
          <a-button type="text" @click="goBack" :style="{ color: t.colorTextSecondary }" :icon="h(ArrowLeft, { size: 14 })" />
          <a-select
            v-model:value="selectedProjectId"
            :options="projectOptions"
            style="width: 260px"
            size="small"
            :bordered="false"
            class="project-select"
            @change="onProjectChange"
            :dropdown-style="{ minWidth: '300px' }"
          />
        </div>

        <!-- 菜单 -->
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          class="project-menu"
          @click="handleMenuClick"
        >
          <a-menu-item v-for="item in menuItems" :key="item.key">
            <span>{{ item.label }}</span>
          </a-menu-item>
        </a-menu>

        <!-- 主题切换 -->
        <a-button
          type="text"
          @click="appStore.toggleTheme"
          :style="{ color: t.colorTextSecondary }"
          :title="isDark ? '切换亮色' : '切换暗色'"
          :icon="themeIcon"
        />
      </div>
    </a-layout-header>

    <!-- 内容区 -->
    <a-layout-content
      class="project-content"
      :style="{ background: t.colorBgLayout }"
    >
      <div
        class="project-page"
        :style="{
          background: t.colorBgContainer,
          borderRadius: `${t.borderRadiusLG}px`,
        }"
      >
        <router-view :key="projectId" />
      </div>
    </a-layout-content>
  </a-layout>

</template>

<style scoped>
.project-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 24px;
  transition: background 0.3s, border-color 0.3s;
}

.project-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.project-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-img {
  height: 28px;
  width: auto;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.project-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-select {
  font-weight: 600;
}

.project-menu {
  flex: 1;
  min-width: 0;
  border-bottom: none !important;
}

.project-content {
  padding: 24px;
  overflow-y: auto;
  transition: background 0.3s;
}

.project-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100%;
  transition: background 0.3s;
}

/* ── AI 平台悬浮按钮 ── */
.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}
</style>
