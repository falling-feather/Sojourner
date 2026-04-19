import type { Effect, Next, ThresholdCheck } from './schema'
import type { GlobalState } from './types'
import type { Rng } from './rng'

export type CheckResolution = {
  checkId: string
  label: string
  rawRoll: number
  score: number
  bandLabel: string
  next: Next
  bandEffects: Effect[] | undefined
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function resolveThresholdCheck(
  check: ThresholdCheck,
  state: GlobalState,
  rng: Rng,
): CheckResolution {
  const rawRoll = rng.roll100()
  const m = check.modifiers
  let mod = 0
  if (m?.addStatWeights) {
    for (const w of m.addStatWeights) {
      mod += state.stats[w.stat] * w.weight
    }
  }
  if (m?.luckWeight) {
    mod += state.stats.luck * m.luckWeight
  }
  if (m?.stressPenalty) {
    mod -= state.stats.stress * m.stressPenalty
  }
  const score = clamp(Math.round(rawRoll + mod), 0, 100)
  const band = check.bands.find((b) => score >= b.min && score <= b.max)
  if (!band) {
    throw new Error(
      `检定「${check.id}」无匹配区间：score=${score}，请检查 bands 是否覆盖 0–100`,
    )
  }
  return {
    checkId: check.id,
    label: check.label,
    rawRoll,
    score,
    bandLabel: band.label,
    next: band.next,
    bandEffects: band.effects,
  }
}
