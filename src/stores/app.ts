import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY_THEME = 'app-theme'
const STORAGE_KEY_PROJECT_VIEW = 'app-project-view'

function loadTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(STORAGE_KEY_THEME)
  if (saved === 'dark' || saved === 'light') return saved
  return 'dark'
}

function loadProjectView(): 'list' | 'card' {
  const saved = localStorage.getItem(STORAGE_KEY_PROJECT_VIEW)
  if (saved === 'list' || saved === 'card') return saved
  return 'list'
}

export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark'>(loadTheme())
  const projectViewMode = ref<'list' | 'card'>(loadProjectView())

  function setTheme(t: 'light' | 'dark') {
    theme.value = t
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  // 持久化
  watch(theme, (val) => {
    localStorage.setItem(STORAGE_KEY_THEME, val)
  })

  watch(projectViewMode, (val) => {
    localStorage.setItem(STORAGE_KEY_PROJECT_VIEW, val)
  })

  return { theme, setTheme, toggleTheme, projectViewMode }
})
