/** 将数值映射为简短档位文案，贴近设计稿中的「低 / 中 / 高」等展示。 */

export function stressBand(v: number): string {
  if (v < 22) return '低'
  if (v < 55) return '中'
  return '高'
}

export function healthDebtBand(v: number): string {
  if (v < 18) return '低'
  if (v < 45) return '中'
  return '高'
}

export function wealthBand(v: number): string {
  if (v < 25) return '紧'
  if (v < 60) return '稳'
  return '裕'
}
