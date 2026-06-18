/**
 * 统一 soft tag 样式 —— 浅底色 + 彩色字（模拟 antd 内置 preset 风格）。
 * 所有自定义颜色 tag 均通过此函数生成 style，避免在每个组件中重复定义。
 *
 * @param hex 颜色值（如 '#52C41A'）
 * @returns { color, background, borderColor } 样式对象
 */
export function softTagStyle(hex: string) {
  return {
    color: hex,
    background: `${hex}14`,
    borderColor: `${hex}30`,
  }
}
