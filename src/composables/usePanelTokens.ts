import { theme } from 'ant-design-vue'
import { watchEffect } from 'vue'

/**
 * 全局注入 token 驱动的 CSS 变量到 :root。
 * 在 main.ts 中调用一次即可，所有子组件通过 var(--panel-xxx) 使用。
 */
export function usePanelTokens() {
  const { token: t } = theme.useToken()

  watchEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--panel-border', t.value.colorBorderSecondary)
    root.style.setProperty('--panel-fill', t.value.colorFillQuaternary)
    root.style.setProperty('--panel-fill-soft', t.value.colorFillTertiary)
    root.style.setProperty('--panel-fill-strong', t.value.colorFillSecondary)
    root.style.setProperty('--panel-text', t.value.colorText)
    root.style.setProperty('--panel-text-secondary', t.value.colorTextSecondary)
    root.style.setProperty('--panel-text-tertiary', t.value.colorTextTertiary)
    root.style.setProperty('--panel-primary', t.value.colorPrimary)
    root.style.setProperty('--panel-success', t.value.colorSuccess)
    root.style.setProperty('--panel-warning', t.value.colorWarning)
    root.style.setProperty('--panel-error', t.value.colorError)
    root.style.setProperty('--panel-radius', `${t.value.borderRadius}px`)
    root.style.setProperty('--panel-radius-lg', `${t.value.borderRadiusLG}px`)
    root.style.setProperty('--panel-radius-sm', `${t.value.borderRadiusSM}px`)
    root.style.setProperty('--panel-card-radius', '4px')
  })
}
