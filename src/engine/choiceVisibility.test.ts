import { describe, expect, it } from 'vitest'
import { isChoiceVisible } from '@/engine/choiceVisibility'
import { emptyGlobalState } from '@/engine/effects'
import type { Choice } from '@/engine/schema'

describe('isChoiceVisible', () => {
  it('treats missing boolean flag as false when visibleWhen.flag.value is false', () => {
    const base = emptyGlobalState({
      stats: { stress: 10, healthDebt: 0, support: 55, wealth: 25, career: 12, luck: 50 },
      flags: {},
      tags: [],
    })
    const needUnmarried: Choice = {
      id: 'k_skip',
      label: 'skip',
      visibleWhen: { flag: { key: 'married', value: false } },
      next: { kind: 'scene', sceneId: 'x' },
    }
    expect(isChoiceVisible(needUnmarried, base)).toBe(true)

    const needMarried: Choice = {
      id: 'k_yes',
      label: 'yes',
      visibleWhen: { flag: { key: 'married', value: true } },
      next: { kind: 'scene', sceneId: 'x' },
    }
    expect(isChoiceVisible(needMarried, base)).toBe(false)
  })
})
