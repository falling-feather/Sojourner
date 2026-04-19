import type { Choice } from './schema'
import type { GlobalState } from './types'

export function isChoiceVisible(choice: Choice, state: GlobalState): boolean {
  const v = choice.visibleWhen
  if (!v) return true
  if (v.tag !== undefined && !state.tags.includes(v.tag)) return false
  if (v.flag !== undefined && state.flags[v.flag.key] !== v.flag.value) return false
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
