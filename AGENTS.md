# AGENTS.md — GEO Workbench 开发规范

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 语言 | TypeScript |
| 构建 | Vite |
| UI 组件 | ant-design-vue 4.x |
| 状态管理 | Pinia |
| 路由 | vue-router 4 |
| HTTP | axios |
| 样式 | Scoped CSS + Ant Design token 体系 |
| 图标 | `@lucide/vue` | 全站统一 |

## 主题系统

### 核心原则

> **组件内禁止硬编码颜色。** 所有颜色必须通过 `theme.useToken()` 从当前主题动态获取，或使用 ant-design-vue 的内置 token 属性（如 `a-button` 的 `type="primary"`）。

### Token 定义

主题 token 统一在 `src/theme/tokens.ts` 中维护：

- `darkTokens` — 暗色 token（遵循 DESIGN.md「Fidelity Dark」规范，亮度海拔模型）
- `lightTokens` — 亮色 token（由暗色反向推导，保持品牌色高饱和科技感）
- `getThemeConfig(mode)` — 生成 ConfigProvider 可用的 `{ algorithm, token, components }` 配置

### 组件中使用 token

> 统一使用 `useTokenMeta()` composable（封装 `theme.useToken()`，扩展了自定义 token 类型），不要直接调用 `theme.useToken()`。

```vue
<script setup lang="ts">
import { useTokenMeta } from '@/composables/useTokenMeta'

const t = useTokenMeta()
// t.value.colorPrimary、t.value.colorBgContainer、t.value.colorQuestionCategory …
</script>

<template>
  <div :style="{ background: t.colorBgContainer }">...</div>
</template>
```

### 添加 / 调整颜色

**只改 `src/theme/tokens.ts`**，所有组件自动生效，无需逐个修改。

步骤：
1. 在 `darkTokens` 和 `lightTokens` 中同步添加/修改 token
2. 如需组件级覆盖，在 `getThemeConfig()` 的 `components` 中添加（参考已有的 `Menu` 覆盖）
3. 组件中通过 `token.value.xxx` 引用

### 主题切换

- 状态由 `useAppStore().theme` 管理（`'dark'` | `'light'`），默认暗色
- 持久化到 `localStorage`（key: `app-theme`）
- `App.vue` 中用 `<a-config-provider :theme="themeConfig">` 全局注入

## 图标系统

### 选型

| 场景 | 图标库 | 用法 |
|---|---|---|
| 图标 | `@lucide/vue` | 全站统一 |

### 原则

- **优先 Lucide**：新增的通用图标一律从 `@lucide/vue` 引入，图标集统一且风格现代
- **按需导入**：禁止全量导入，只 import 用到的图标组件
- **统一尺寸**：图标尺寸默认 `16px`，通过 `:size` prop 控制

### 按钮中使用图标

antd 按钮原生用 `:icon` prop + Vue `h()` 渲染函数，**不用 `<template #icon>` 插槽**。Lucide 图标 size 取 `14` 对齐 antd 默认 `fontSize`。

```vue
<script setup lang="ts">
import { h } from 'vue'
import { Search, Sparkles } from '@lucide/vue'
</script>

<template>
  <a-button type="primary" :icon="h(Search, { size: 14 })">搜索</a-button>
  <a-button :icon="h(Sparkles, { size: 14 })">AI 生成</a-button>
</template>
```

Lucide 图标没有 antd 内置的 `anticon` class，通过 `h()` 传入后会缺少间距且垂直偏上，需要**全局**补一句 CSS（建议放 `src/style.css`）：

```css
.ant-btn svg {
  margin-inline-end: 6px;
  vertical-align: -0.125em;
}
```

### Lucide 图标查找

官网 https://lucide.dev/icons/ — 支持中英文关键词搜索，选定后复制组件名即可。命名规范为 PascalCase（如 `ArrowRight`、`ChevronDown`、`Search`）。

## 标签（Tag）样式

### 内置色优先

antd 语义状态（`success`、`warning`、`error`、`default`）直接用 `a-tag` 的 `color` prop：

```vue
<a-tag color="success">已发布</a-tag>
<a-tag color="warning">审核中</a-tag>
```

### 自定义色用 `:style` + tinted helper

当需要自定义颜色（如品类区分、平台标识），不能用 `a-tag` 的 `color` prop（传 hex 会变成实心填充 + 白字）。统一使用 `src/composables/useTagStyle.ts` 导出的 `softTagStyle(hex)`：

```vue
<script setup lang="ts">
import { softTagStyle } from '@/composables/useTagStyle'
</script>

<template>
  <a-tag :style="softTagStyle(item.color)" class="soft-tag">{{ item.label }}</a-tag>
</template>
```

- `softTagStyle(hex)` 内部生成 `{ color, background: hex+'14', borderColor: hex+'30' }`（14→8% alpha，30→19% alpha）
- `.soft-tag` class 已全局定义在 `src/style.css`，不要在各组件重复

## 目录结构

```
src/
├── main.ts              # 入口：注册 Pinia / Router / Antd
├── App.vue              # ConfigProvider + <router-view />
├── style.css            # 全局样式重置（不含颜色）
├── theme/
│   └── tokens.ts        # 暗色/亮色 token + getThemeConfig()
├── router/
│   └── index.ts         # 路由配置
├── stores/
│   └── app.ts           # 全局状态（theme 等）
├── utils/
│   └── request.ts       # axios 实例 + 拦截器
├── layouts/
│   └── MainLayout.vue   # 顶部水平导航布局
└── views/
    ├── Home.vue          # 首页
    └── About.vue         # 关于页
```

## 路由规范

- 使用命名路由（`name: 'Home'`），菜单跳转统一走 `router.push({ name: 'Home' })`
- 页面组件放 `src/views/`，按功能模块组织
- 路由 meta 中定义 `title` 和 `icon` 用于菜单渲染

## API 请求

- 统一使用 `src/utils/request.ts` 导出的 axios 实例
- baseURL 通过 `VITE_API_BASE_URL` 环境变量配置，默认 `/api`
- 响应拦截器统一处理 401/403/404/500 错误
- 请求拦截器中预留 token 注入位置

## 列表页布局规范

项目中所有列表页必须遵循统一布局结构，以 `Questions.vue` 和 `Tasks.vue` 为基准。

### 结构模板

```vue
<template>
  <div class="xxx-page">
    <!-- 标题 -->
    <div class="page-header">
      <h2 :style="{ color: t.colorText }">页面标题</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <a-select v-model:value="filter1" placeholder="全部类型" allow-clear style="width: 140px">...</a-select>
      <a-select v-model:value="filter2" placeholder="全部状态" allow-clear style="width: 140px">...</a-select>
      <div class="filter-bar-spacer" />
      <a-button type="primary" @click="openCreate" :icon="h(Plus, { size: 14 })">新建</a-button>
    </div>

    <!-- 表格卡片 -->
    <a-card class="list-card" :style="{ borderColor: t.colorBorderSecondary }">
      <a-table
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        ...
      </a-table>
      <div class="table-footer">
        <div class="table-count">共 {{ total }} 条</div>
      </div>
    </a-card>
  </div>
</template>
```

### CSS 基准

```css
.xxx-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-bar-spacer { flex: 1; }
.list-card :deep(.ant-card-body) { padding: 0; }
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 18px 16px 16px; }
.table-count { color: v-bind('t.colorTextSecondary'); font-size: 13px; }
.action-icons { display: flex; align-items: center; gap: 2px; }
.action-icons :deep(.ant-btn) { color: v-bind('t.colorTextTertiary'); }
```

### 规则

- **表格必须包裹在 `<a-card class="list-card">` 内**，`borderColor` 用 `t.colorBorderSecondary`
- **分页不用表格内置 `pagination`**，统一用自定义 `table-footer`
- **操作列按钮放 `.action-icons` 容器**内，颜色固定 `colorTextTertiary`
- **禁止自定义按钮尺寸/圆角**（`height`、`border-radius`、`font-size` 等覆写），全部走 antd 默认
- **删除确认统一用 `Modal.confirm`**，禁止 `a-popconfirm`（DOM 竞争 bug）
- **间距统一 8px 基数**：页面级 gap 16px，筛选/按钮 gap 12px
- **颜色全用 token**：`v-bind('t.color...')` 或 `useTokenMeta()`，不写 hex
