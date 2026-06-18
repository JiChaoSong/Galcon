import type { ComputedRef } from 'vue'
import { theme } from 'ant-design-vue'
import type { GlobalToken } from 'ant-design-vue/es/theme/interface'

/** 自定义 token，扩展自 antd GlobalToken */
export interface CustomToken extends GlobalToken {
  colorQuestionCategory: string
  colorQuestionCompetitor: string
  colorQuestionScenario: string
  colorQuestionPurchase: string
  colorQuestionAlternative: string
  colorQuestionBrand: string
  colorQuestionRisk: string
}

/**
 * 统一 token 出口 —— 封装 theme.useToken()。
 * 所有自定义 token（包括 tokens.ts 中新增的品类色等）均通过此 composable 获取，
 * token 新增时只需扩展 CustomToken 接口即可，无需逐个组件修改。
 *
 * @example
 *   const t = useTokenMeta()
 *   t.value.colorQuestionCategory  // → '#FFB648'（暗色）| '#E8A400'（亮色）
 */
export function useTokenMeta(): ComputedRef<CustomToken> {
  const { token } = theme.useToken()
  return token as ComputedRef<CustomToken>
}
