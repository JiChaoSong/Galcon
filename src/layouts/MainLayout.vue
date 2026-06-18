<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { theme } from 'ant-design-vue'
import { Sun, Moon } from '@lucide/vue'
import logoSvg from '@/assets/galcon.svg'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const { token: t } = theme.useToken()

// ── 从路由配置生成菜单项 ──
const menuItems = computed(() => {
  const rootRoute = router.options.routes.find((r) => r.path === '/')
  if (!rootRoute?.children) return []
  return rootRoute.children
    .filter((child: RouteRecordRaw) => child.meta?.title)
    .map((child: RouteRecordRaw) => ({
      key: child.name as string,
      label: child.meta?.title as string,
    }))
})

const selectedKeys = ref<string[]>([(route.name as string) ?? ''])
watch(() => route.name, (name) => { selectedKeys.value = [(name as string) ?? ''] })

const isDark = computed(() => appStore.theme === 'dark')
const themeIcon = computed(() => isDark.value ? h(Sun, { size: 16 }) : h(Moon, { size: 16 }))

function handleMenuClick({ key }: { key: string }) {
  router.push({ name: key })
}

// ── 基于 token 的动态样式 ──
const headerStyle = computed(() => ({
  background: t.value.colorBgContainer,
  borderBottom: isDark.value ? 'none' : `1px solid ${t.value.colorBorderSecondary}`,
}))
const logoStyle = computed(() => ({ color: t.value.colorText }))
const layoutContentStyle = computed(() => ({ background: t.value.colorBgLayout }))
const pageContainerStyle = computed(() => ({ background: t.value.colorBgContainer }))
</script>

<template>
  <a-layout style="height: 100vh; overflow: hidden">
    <a-layout-header class="layout-header" :style="headerStyle">
      <div class="header-inner">
        <div class="logo" :style="logoStyle">
          <img :src="logoSvg" alt="Galcon" class="logo-img" />
          <span class="logo-text">Galcon</span>
        </div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          class="header-menu"
          @click="handleMenuClick"
        >
          <a-menu-item v-for="item in menuItems" :key="item.key">
            <span>{{ item.label }}</span>
          </a-menu-item>
        </a-menu>
        <div class="header-actions">
          <a-button type="text" @click="appStore.toggleTheme" :title="isDark ? '切换亮色' : '切换暗色'" :icon="themeIcon" />
        </div>
      </div>
    </a-layout-header>

    <a-layout-content class="layout-content" :style="layoutContentStyle">
      <div class="page-container" :style="pageContainerStyle">
        <router-view />
      </div>
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
.layout-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 24px;
  transition: background 0.3s, border-color 0.3s;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  width: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  margin-right: 40px;
  transition: color 0.3s;
}

.logo-img { height: 28px; width: auto; }

.logo-text {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.header-menu {
  flex: 1;
  min-width: 0;
  border-bottom: none !important;
}

.header-actions {
  margin-left: 16px;
  display: flex;
  align-items: center;
}

.layout-content {
  padding: 24px;
  overflow-y: auto;
  transition: background 0.3s;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100%;
  border-radius: 8px;
  transition: background 0.3s;
}
</style>
