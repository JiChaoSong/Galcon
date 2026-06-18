import { defineStore } from 'pinia'
import { ref } from 'vue'

// ── AI 平台（PRD 7.4） ──
export interface Platform {
  id: string
  name: string
  color: string
  chatUrl: string
  region: 'domestic' | 'overseas'
  supportsCitation: boolean
  supportsWebSearch: boolean
  testMethod: 'manual' | 'api' | 'rpa' | 'plugin'
  notes: string
}

// ── 项目-平台关联（记录每个项目勾选了哪些平台） ──
export interface ProjectPlatform {
  platformId: string
  projectId: string
  coverage: string   // 覆盖率（如 '100%'、'95%'），后续由测试数据计算
}

let _pid = 10
function nextId() { return String(++_pid) }

const initialPlatforms: Platform[] = [
  { id: '1', name: 'DeepSeek', color: '#4C7DFF', chatUrl: 'https://chat.deepseek.com/', region: 'domestic', supportsCitation: false, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '2', name: 'Kimi', color: '#52C41A', chatUrl: 'https://kimi.moonshot.cn/', region: 'domestic', supportsCitation: true, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '3', name: '豆包', color: '#FF9F43', chatUrl: 'https://www.doubao.com/chat/', region: 'domestic', supportsCitation: false, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '4', name: '通义千问', color: '#B37FEB', chatUrl: 'https://tongyi.aliyun.com/qianwen/', region: 'domestic', supportsCitation: true, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '5', name: 'ChatGPT', color: '#69B1FF', chatUrl: 'https://chat.openai.com/', region: 'overseas', supportsCitation: true, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '6', name: '智谱清言', color: '#FF85C0', chatUrl: 'https://chatglm.cn/', region: 'domestic', supportsCitation: false, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '7', name: '文心一言', color: '#597EF7', chatUrl: 'https://yiyan.baidu.com/', region: 'domestic', supportsCitation: false, supportsWebSearch: true, testMethod: 'manual', notes: '' },
  { id: '8', name: 'AcmeCloud', color: '#FF6B7A', chatUrl: '', region: 'domestic', supportsCitation: false, supportsWebSearch: false, testMethod: 'manual', notes: '内部测试平台' },
]

// mock：项目 1 已选了前 6 个平台
const initialAssociations: ProjectPlatform[] = [
  { platformId: '1', projectId: '1', coverage: '98%' },
  { platformId: '2', projectId: '1', coverage: '96%' },
  { platformId: '3', projectId: '1', coverage: '95%' },
  { platformId: '4', projectId: '1', coverage: '93%' },
  { platformId: '5', projectId: '1', coverage: '100%' },
  { platformId: '6', projectId: '1', coverage: '89%' },
]

export const usePlatformStore = defineStore('platform', () => {
  const platforms = ref<Platform[]>(initialPlatforms)
  const associations = ref<ProjectPlatform[]>(initialAssociations)

  // ── 按项目获取平台（含是否选中 + 覆盖率） ──
  function getForProject(projectId: string) {
    const assoc = associations.value.filter(a => a.projectId === projectId)
    return platforms.value.map(p => {
      const link = assoc.find(a => a.platformId === p.id)
      return {
        ...p,
        checked: !!link,
        coverage: link?.coverage ?? '-',
      }
    })
  }

  // ── 切换项目平台勾选 ──
  function toggleProjectPlatform(projectId: string, platformId: string) {
    const idx = associations.value.findIndex(a => a.projectId === projectId && a.platformId === platformId)
    if (idx >= 0) {
      associations.value.splice(idx, 1)
    } else {
      associations.value.push({ platformId, projectId, coverage: '-' })
    }
  }

  // ── 项目全选/取消全选 ──
  function selectAll(projectId: string) {
    const existing = associations.value.filter(a => a.projectId === projectId).map(a => a.platformId)
    for (const p of platforms.value) {
      if (!existing.includes(p.id)) {
        associations.value.push({ platformId: p.id, projectId, coverage: '-' })
      }
    }
  }

  function deselectAll(projectId: string) {
    associations.value = associations.value.filter(a => a.projectId !== projectId)
  }

  // ── 新增平台 ──
  function addPlatform(data: Partial<Platform> & { name: string }) {
    platforms.value.push({
      id: nextId(),
      name: data.name,
      color: data.color ?? '#4C7DFF',
      chatUrl: data.chatUrl ?? '',
      region: data.region ?? 'domestic',
      supportsCitation: data.supportsCitation ?? false,
      supportsWebSearch: data.supportsWebSearch ?? true,
      testMethod: data.testMethod ?? 'manual',
      notes: data.notes ?? '',
    })
  }

  // ── 更新平台 ──
  function updatePlatform(id: string, data: Partial<Platform>) {
    const idx = platforms.value.findIndex(p => p.id === id)
    if (idx >= 0) Object.assign(platforms.value[idx], data)
  }

  // ── 删除平台（同时清理关联） ──
  function removePlatform(id: string) {
    platforms.value = platforms.value.filter(p => p.id !== id)
    associations.value = associations.value.filter(a => a.platformId !== id)
  }

  return { platforms, associations, getForProject, toggleProjectPlatform, selectAll, deselectAll, addPlatform, updatePlatform, removePlatform }
})
