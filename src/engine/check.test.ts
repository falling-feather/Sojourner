import { describe, expect, it } from 'vitest'
import { resolveThresholdCheck } from './check'
import { createRng } from './rng'
import { emptyGlobalState } from './effects'
import type { ThresholdCheck } from './schema'

describe('resolveThresholdCheck', () => {
  it('同一 seed 得到同一 band（确定性）', () => {
    const check: ThresholdCheck = {
      kind: 'threshold',
      id: 't',
      label: '测试',
      modifiers: {
        addStatWeights: [{ stat: 'career', weight: 0.3 }],
        stressPenalty: 0.1,
      },
      bands: [
        { min: 0, max: 49, label: '低', next: { kind: 'scene', sceneId: 'a' } },
        { min: 50, max: 100, label: '高', next: { kind: 'scene', sceneId: 'b' } },
      ],
    }
    const state = emptyGlobalState()
    const a = resolveThresholdCheck(check, state, createRng(42))
    const b = resolveThresholdCheck(check, state, createRng(42))
    expect(a.rawRoll).toBe(b.rawRoll)
    expect(a.score).toBe(b.score)
    expect(a.bandLabel).toBe(b.bandLabel)
  })
})
