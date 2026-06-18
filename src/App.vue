<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { getThemeConfig } from '@/theme/tokens'
import { usePanelTokens } from '@/composables/usePanelTokens'

const appStore = useAppStore()

const themeConfig = computed(() => getThemeConfig(appStore.theme))

// 全局注入 token CSS 变量
usePanelTokens()
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <router-view />
  </a-config-provider>
</template>
