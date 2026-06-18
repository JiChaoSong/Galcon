<script setup lang="ts">
import { h, reactive, ref } from 'vue'
import { message, theme, Modal } from 'ant-design-vue'
import { Plus, Pencil, Trash2 } from '@lucide/vue'
import { usePlatformStore } from '@/stores/platform'
import type { Platform } from '@/stores/platform'

const { token: t } = theme.useToken()
const store = usePlatformStore()

// ── 表单抽屉 ──
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<Platform>({
  color: '#4C7DFF',
  chatUrl: '',
  id: '', name: '', region: 'domestic', supportsCitation: false,
  supportsWebSearch: true, testMethod: 'manual', notes: '',
})

const regionOptions = [
  { label: '国内', value: 'domestic' },
  { label: '海外', value: 'overseas' },
]
const testMethodOptions = [
  { label: '手动', value: 'manual' },
  { label: 'API', value: 'api' },
  { label: 'RPA', value: 'rpa' },
  { label: '插件', value: 'plugin' },
]

// ── 表格列 ──
const columns = [
  { title: '平台名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '地区', dataIndex: 'region', key: 'region', width: 80 },
  { title: '引用支持', dataIndex: 'supportsCitation', key: 'citation', width: 90 },
  { title: '联网搜索', dataIndex: 'supportsWebSearch', key: 'web', width: 90 },
  { title: '测试方式', dataIndex: 'testMethod', key: 'method', width: 90 },
  { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
  { title: '操作', key: 'action', width: 120 },
]

// ── 方法 ──
function openAdd() {
  editingId.value = null
  Object.assign(form, {
    color: '#4C7DFF',
    chatUrl: '',
    id: '', name: '', region: 'domestic', supportsCitation: false,
    supportsWebSearch: true, testMethod: 'manual', notes: '',
  })
  drawerOpen.value = true
}

function openEdit(platform: Platform) {
  editingId.value = platform.id
  Object.assign(form, { ...platform })
  drawerOpen.value = true
}

function handleSubmit() {
  const name = form.name.trim()
  if (!name) { message.warning('请输入平台名称'); return }
  if (editingId.value) {
    store.updatePlatform(editingId.value, { ...form, name })
    message.success('平台已更新')
  } else {
    store.addPlatform({ ...form, name })
    message.success('平台已添加')
  }
  drawerOpen.value = false
}

function handleDelete(id: string) {
  const p = store.platforms.find(x => x.id === id)
  store.removePlatform(id)
  message.success(`平台「${p?.name}」已删除`)
}

function confirmDeletePlatform(id: string) {
  const p = store.platforms.find(x => x.id === id)
  Modal.confirm({
    title: '确认删除该平台？',
    content: `删除平台「${p?.name}」后，关联的测试数据将被保留但平台信息不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => handleDelete(id),
  })
}

function regionLabel(v: string) { return regionOptions.find(o => o.value === v)?.label ?? v }
function methodLabel(v: string) { return testMethodOptions.find(o => o.value === v)?.label ?? v }
</script>

<template>
  <div class="platform-section">
    <div class="section-toolbar">
      <h3 :style="{ color: t.colorText, margin: 0 }">AI 平台配置</h3>
      <a-button type="primary" :icon="h(Plus, { size: 14 })" @click="openAdd">
        新增平台
      </a-button>
    </div>

    <a-card size="small" :style="{ borderColor: t.colorBorderSecondary, marginTop: '16px' }">
      <a-table
        :columns="columns"
        :data-source="store.platforms"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'region'">
            {{ regionLabel(record.region) }}
          </template>
          <template v-else-if="column.key === 'citation'">
            <a-tag :color="record.supportsCitation ? 'success' : 'default'">
              {{ record.supportsCitation ? '支持' : '不支持' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'web'">
            <a-tag :color="record.supportsWebSearch ? 'success' : 'default'">
              {{ record.supportsWebSearch ? '支持' : '不支持' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'method'">
            {{ methodLabel(record.testMethod) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="0">
              <a-button type="text" size="small" :icon="h(Pencil, { size: 14 })" @click="openEdit(record)" />
              <a-button type="text" size="small" danger :icon="h(Trash2, { size: 14 })" @click="confirmDeletePlatform(record.id)" />
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="drawerOpen"
      :title="editingId ? '编辑平台' : '新增平台'"
      :width="440"
      placement="right"
    >
      <a-form layout="vertical">
        <a-form-item label="平台名称" required>
          <a-input v-model:value="form.name" placeholder="如 DeepSeek、ChatGPT" />
        </a-form-item>
        <a-form-item label="地区">
          <a-select v-model:value="form.region" :options="regionOptions" />
        </a-form-item>
        <a-form-item label="引用来源支持">
          <a-switch v-model:checked="form.supportsCitation" />
        </a-form-item>
        <a-form-item label="联网搜索支持">
          <a-switch v-model:checked="form.supportsWebSearch" />
        </a-form-item>
        <a-form-item label="测试方式">
          <a-select v-model:value="form.testMethod" :options="testMethodOptions" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.notes" :rows="2" />
        </a-form-item>
      </a-form>

      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px">
        <a-button @click="drawerOpen = false">取消</a-button>
        <a-button type="primary" @click="handleSubmit">保存</a-button>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
