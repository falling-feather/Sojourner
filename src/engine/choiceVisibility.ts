import type { Choice } from './schema'
import type { GlobalState } from './types'

export function isChoiceVisible(choice: Choice, state: GlobalState): boolean {
  const v = choice.visibleWhen
  if (!v) return true
  if (v.tag !== undefined && !state.tags.includes(v.tag)) return false
  // 布尔 flag：未写入时视为 false，避免「仅写了 m_yes 为 true、m_no 未写」导致
  // `married === false` 的选项因 undefined !== false 而全部被隐藏。
  if (v.flag !== undefined) {
    const got = state.flags[v.flag.key]
    const want = v.flag.value
    if (want) {
      if (got !== true) return false
    } else if (got === true) {
      return false
    }
  }
  if (v.statMax !== undefined && state.stats[v.statMax.stat] > v.statMax.value)
    return false
  if (v.statMin !== undefined && state.stats[v.statMin.stat] < v.statMin.value)
    return false
  return true
}

export function visibleChoices(choices: Choice[] | undefined, state: GlobalState) {
  if (!choices) return []
  return choices.filter((c) => isChoiceVisible(c, state))
}
