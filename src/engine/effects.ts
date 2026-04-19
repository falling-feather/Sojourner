import type { Effect, StatId } from './schema'
import type { GlobalState } from './types'
import { STAT_IDS } from './types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function emptyGlobalState(partial?: Partial<GlobalState>): GlobalState {
  const base: GlobalState = {
    stats: {
      stress: 20,
      healthDebt: 0,
      support: 50,
      wealth: 30,
      career: 25,
      luck: 50,
    },
    flags: {},
    tags: [],
  }
  if (!partial) return base
  return {
    stats: { ...base.stats, ...partial.stats },
    flags: { ...base.flags, ...partial.flags },
    tags: partial.tags ?? base.tags,
  }
}

export function applyEffects(state: GlobalState, effects: Effect[] | undefined): GlobalState {
  if (!effects?.length) return state
  let next: GlobalState = {
    stats: { ...state.stats },
    flags: { ...state.flags },
    tags: [...state.tags],
  }
  for (const e of effects) {
    next = applyOne(next, e)
  }
  return next
}

function applyOne(state: GlobalState, e: Effect): GlobalState {
  switch (e.op) {
    case 'addStat': {
      const stat = e.stat as StatId
      const v = state.stats[stat] + e.value
      return {
        ...state,
        stats: { ...state.stats, [stat]: v },
      }
    }
    case 'setStat': {
      const stat = e.stat as StatId
      return {
        ...state,
        stats: { ...state.stats, [stat]: e.value },
      }
    }
    case 'clampStat': {
      const stat = e.stat as StatId
      const v = clamp(state.stats[stat], e.min, e.max)
      return {
        ...state,
        stats: { ...state.stats, [stat]: v },
      }
    }
    case 'setFlag':
      return {
        ...state,
        flags: { ...state.flags, [e.key]: e.value },
      }
    case 'addTag':
      if (state.tags.includes(e.tag)) return state
      return { ...state, tags: [...state.tags, e.tag] }
    case 'removeTag':
      return {
        ...state,
        tags: state.tags.filter((t) => t !== e.tag),
      }
    default: {
      const _x: never = e
      return _x
    }
  }
}

/** 将 stats 约束在合理区间（引擎兜底，内容层也可使用 clampStat） */
export function normalizeStats(state: GlobalState): GlobalState {
  const stats = { ...state.stats }
  for (const id of STAT_IDS) {
    if (id === 'healthDebt') {
      stats[id] = Math.max(0, stats[id])
    } else {
      stats[id] = clamp(stats[id], 0, 100)
    }
  }
  return { ...state, stats }
}
