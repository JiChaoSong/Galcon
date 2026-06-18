import { theme } from 'ant-design-vue'

// ── 基础品牌色（定义标准色相，供派生参考） ──
const brand = {
  primary: '#00a3ff',
  secondary: '#05e777',
  tertiary: '#e88300',
  error: '#f44336',   // 暗色下鲜艳的警示红

  borderRadius: 2,
  borderRadiusLG: 5,
  borderRadiusSM: 4,

  cardRadius: 4,
}

// ── 暗色主题 token ──
export const darkTokens = {
  // 品牌色
  colorPrimary: brand.primary,
  colorSuccess: brand.secondary,
  colorWarning: brand.tertiary,
  colorError: brand.error,        // 暗色使用鲜艳红，确保按钮/菜单 danger 项醒目
  colorInfo: brand.primary,

  // 底色体系（深 → 浅）
  colorBgBase: '#131313',
  colorBgLayout: '#0e0e0e',
  colorBgContainer: '#1c1b1b',
  colorBgElevated: '#2a2a2a',
  colorBgSpotlight: '#353534',

  // 文字
  colorTextBase: '#e5e2e1',
  colorText: '#e5e2e1',
  colorTextSecondary: '#bec7d4',
  colorTextTertiary: '#88919d',
  colorTextQuaternary: '#5a6370',

  // 边框 / 分割线
  colorBorder: '#3f4852',
  colorBorderSecondary: '#2e303a',

  // 填充
  colorFill: 'rgba(229, 226, 225, 0.08)',
  colorFillSecondary: 'rgba(229, 226, 225, 0.12)',
  colorFillTertiary: 'rgba(229, 226, 225, 0.05)',
  colorFillQuaternary: 'rgba(229, 226, 225, 0.02)',

  // 圆角（修正：同步 DESIGN.md 规范 8px）
  borderRadius: brand.borderRadius,
  borderRadiusLG: brand.borderRadiusLG,
  borderRadiusSM: brand.borderRadiusSM,

  cardRadius: brand.cardRadius,

  // 字号
  fontSize: 14,
  fontSizeLG: 16,
  fontSizeXL: 18,
  fontSizeHeading1: 48,
  fontSizeHeading2: 32,
  fontSizeHeading3: 24,

  // 问题类型色（用于标签文字与图标）
  colorQuestionCategory: '#FFB648',
  colorQuestionCompetitor: '#69B1FF',
  colorQuestionScenario: '#B37FEB',
  colorQuestionPurchase: '#FF85C0',
  colorQuestionAlternative: '#597EF7',
  colorQuestionBrand: '#52C41A',
  colorQuestionRisk: '#FF7875',
}

// ── 亮色主题 token（高度同步暗色调，保持高饱和科技感） ──
export const lightTokens = {
  // 品牌色（微调亮度，保留暗色的鲜艳度与高饱和，同时兼顾白底可读性）
  colorPrimary: '#008ae6',       // 接近暗色 #00a3ff，但在白底上更清晰的高能电光蓝
  colorSuccess: '#00c85d',       // 接近暗色 #05e777，充满活力的荧光绿
  colorWarning: '#d47600',       // 接近暗色 #e88300，饱满明亮的警告橙
  colorError: '#e53935',         // 接近暗色 #ffb4ab / 经典红，高亮危险红
  colorInfo: '#008ae6',          // 与主色保持一致

  // 底色体系（浅 → 深：为了衬托高饱和品牌色，底色需要干净、纯粹）
  colorBgBase: '#ffffff',        // 基础纯白
  colorBgLayout: '#f5f7fa',      // 干净的浅灰蓝背景
  colorBgContainer: '#ffffff',   // 容器白
  colorBgElevated: '#ffffff',    // 弹窗白
  colorBgSpotlight: '#1e1e1f',   // 气泡提示（反色）

  // 文字（调深文字颜色，去和高饱和的主题色形成强烈对比，提升高级感）
  colorTextBase: '#111214',
  colorText: '#111214',
  colorTextSecondary: '#4b515a',
  colorTextTertiary: '#808793',
  colorTextQuaternary: '#b0b7c3',

  // 边框 / 分割线
  colorBorder: '#dcdfe6',
  colorBorderSecondary: '#ebeeef',

  // 填充
  colorFill: 'rgba(17, 18, 20, 0.06)',
  colorFillSecondary: 'rgba(17, 18, 20, 0.04)',
  colorFillTertiary: 'rgba(17, 18, 20, 0.02)',
  colorFillQuaternary: 'rgba(17, 18, 20, 0.01)',

  // 圆角 & 字号与暗色保持一致即可
  borderRadius: brand.borderRadius,
  borderRadiusLG: brand.borderRadiusLG,
  borderRadiusSM: brand.borderRadiusSM,

  cardRadius: brand.cardRadius,

  // 问题类型色（亮色下略加深，保证白底可读）
  colorQuestionCategory: '#E8A400',
  colorQuestionCompetitor: '#3D8BFD',
  colorQuestionScenario: '#8B5CF6',
  colorQuestionPurchase: '#E85D9A',
  colorQuestionAlternative: '#4C6EF5',
  colorQuestionBrand: '#389E0D',
  colorQuestionRisk: '#E84D4D',

}

// ── 主题配置生成函数 ──
export function getThemeConfig(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: isDark ? darkTokens : lightTokens,
    components: {
      Menu: {
        // 动态适配菜单文字颜色
        colorItemText: isDark ? darkTokens.colorTextSecondary : lightTokens.colorTextSecondary,
        colorItemTextHover: isDark ? darkTokens.colorText : lightTokens.colorText,
        colorItemTextHoverHorizontal: isDark ? darkTokens.colorText : lightTokens.colorText,
        colorItemTextSelected: isDark ? darkTokens.colorPrimary : lightTokens.colorPrimary,
        colorItemTextSelectedHorizontal: isDark ? darkTokens.colorPrimary : lightTokens.colorPrimary,

        // danger 项颜色
        colorDangerItemText: isDark ? '#f44336' : lightTokens.colorError,
        colorDangerItemTextHover: isDark ? '#ff7961' : lightTokens.colorError,
        colorDangerItemTextSelected: isDark ? '#f44336' : lightTokens.colorError,

        // 动态适配菜单背景及悬浮交互
        colorItemBg: 'transparent',
        colorItemBgHover: isDark ? 'rgba(229, 226, 225, 0.08)' : 'rgba(26, 28, 30, 0.05)',
        colorItemBgSelected: 'transparent',
        colorItemBgSelectedHorizontal: 'transparent',
        colorSubItemBg: 'transparent',
      },
    },
  }
}