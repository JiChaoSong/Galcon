<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>
    <h2>首页</h2>
    <p>欢迎使用管理后台</p>
    <a-divider />
    <a-space direction="vertical" :size="16">
      <a-typography-text>计数器示例：</a-typography-text>
      <a-space>
        <a-button type="primary" @click="count++">+1</a-button>
        <a-button @click="count--">-1</a-button>
        <a-tag color="blue">{{ count }}</a-tag>
      </a-space>
    </a-space>
  </div>
</template>
