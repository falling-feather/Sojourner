import { describe, expect, it } from 'vitest'
import {
  computeStressSplitEdges,
  resolveThresholdCheck,
} from './check'
import { createRng } from './rng'
import { emptyGlobalState } from './effects'
import type { ThresholdCheck } from './schema'

describe('computeStressSplitEdges', () => {
  it('低压接近旧版分界', () => {
    expect(computeStressSplitEdges(0)).toEqual({ lowMax: 26, highMin: 73 })
  })
  it('压力升高时失常档变宽、超常门槛抬高', () => {
    const e = computeStressSplitEdges(60)
    expect(e.lowMax).toBeGreaterThanOrEqual(8)
    expect(e.highMin).toBeGreaterThan(e.lowMax)
  })
})

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

  it('stressSplit：返回 hideDice 与叙事分数，且确定性', () => {
    const check: ThresholdCheck = {
      kind: 'threshold',
      id: 'gaokao_main',
      label: '高考发挥',
      bandMode: 'stressSplit',
      modifiers: {
        addStatWeights: [{ stat: 'career', weight: 0.18 }],
        luckWeight: 0.08,
      },
      bands: [
        {
          min: 0,
          max: 33,
          label: '失常',
          next: { kind: 'scene', sceneId: 'a' },
        },
        {
          min: 34,
          max: 72,
          label: '正常发挥',
          next: { kind: 'scene', sceneId: 'b' },
        },
        {
          min: 73,
          max: 100,
          label: '超常发挥',
          next: { kind: 'scene', sceneId: 'c' },
        },
      ],
    }
    const state = emptyGlobalState({
      stats: {
        stress: 20,
        healthDebt: 0,
        support: 50,
        wealth: 30,
        career: 75,
        luck: 50,
      },
      flags: {},
      tags: [],
    })
    const a = resolveThresholdCheck(check, state, createRng(99))
    const b = resolveThresholdCheck(check, state, createRng(99))
    expect(a.hideDice).toBe(true)
    expect(a.examTotalScore).toBeDefined()
    expect(a.iqDisplay).toBeDefined()
    expect(a.rawRoll).toBe(b.rawRoll)
    expect(a.bandLabel).toBe(b.bandLabel)
    expect(a.examTotalScore).toBe(b.examTotalScore)
  })
})
