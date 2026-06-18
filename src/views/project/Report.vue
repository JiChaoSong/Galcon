<script setup lang="ts">
import { theme } from 'ant-design-vue'
const { token: t } = theme.useToken()
</script>

<template>
  <div>
    <h2 :style="{ color: t.colorText, margin: '0 0 16px' }">报告生成</h2>
    <a-empty description="报告生成功能开发中" />
  </div>
</template>
