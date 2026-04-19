import { describe, expect, it } from 'vitest'
import { applyEffects, emptyGlobalState } from './effects'
import type { Effect } from './schema'

describe('applyEffects', () => {
  it('adds stats', () => {
    const s = emptyGlobalState()
    const e: Effect[] = [{ op: 'addStat', stat: 'stress', value: 5 }]
    const n = applyEffects(s, e)
    expect(n.stats.stress).toBe(s.stats.stress + 5)
  })

  it('chains flags and tags', () => {
    let s = emptyGlobalState()
    const e: Effect[] = [
      { op: 'setFlag', key: 'tier', value: true },
      { op: 'addTag', tag: '熬夜' },
    ]
    s = applyEffects(s, e)
    expect(s.flags.tier).toBe(true)
    expect(s.tags).toContain('熬夜')
  })
})
