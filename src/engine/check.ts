import type { Effect, Next, ThresholdCheck } from './schema'
import type { GlobalState } from './types'
import type { Rng } from './rng'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * 高考 stressSplit：与策划约定
 * - 失常上界 ≈ 压力/2（压力越高，失常档越「宽」）
 * - 超常下界 ≈ 压力（压力越高，进入超常所需的内部检定分越高）
 * - 压力极低时用接近旧版 0–28 / 29–72 / 73–100 的静态切分，避免区间退化
 */
export function computeStressSplitEdges(stress: number): {
  lowMax: number
  highMin: number
} {
  const S = clamp(Math.round(stress), 0, 100)
  if (S <= 6) {
    return { lowMax: 26, highMin: 73 }
  }
  const lowMax = clamp(Math.floor(S / 2), 8, 46)
  let highMin = S
  if (highMin <= lowMax + 8) {
    highMin = lowMax + 9
  }
  highMin = clamp(highMin, lowMax + 9, 94)
  return { lowMax, highMin }
}

/** 叙事用「智商」展示值（与学业积淀 career 挂钩，非独立属性） */
export function iqDisplayFromCareer(career: number): number {
  return clamp(Math.round(55 + career * 0.45), 55, 100)
}

/** 卷面基准分：高学业积淀 → 更高基准（约 360–600+） */
export function gaokaoBaseScoreFromCareer(career: number): number {
  return clamp(Math.round(360 + career * 2.4), 320, 620)
}

function bandIndexForScore(
  score: number,
  lowMax: number,
  highMin: number,
): 0 | 1 | 2 {
  if (score <= lowMax) return 0
  if (score < highMin) return 1
  return 2
}

function performanceDeltaForBand(
  bandIdx: 0 | 1 | 2,
  rawRoll: number,
): number {
  const r = rawRoll % 100
  if (bandIdx === 0) {
    return -52 + (r % 34)
  }
  if (bandIdx === 1) {
    return -6 + (r % 28)
  }
  return 20 + (r % 45)
}

export type CheckResolution = {
  checkId: string
  label: string
  rawRoll: number
  score: number
  bandLabel: string
  next: Next
  bandEffects: Effect[] | undefined
  /** 高考 stressSplit：不向玩家展示骰值与内部结算分 */
  hideDice?: boolean
  iqDisplay?: number
  baseScore?: number
  performanceDelta?: number
  examTotalScore?: number
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
  const stressSplit = check.bandMode === 'stressSplit'
  if (!stressSplit && m?.stressPenalty) {
    mod -= state.stats.stress * m.stressPenalty
  }

  const score = clamp(Math.round(rawRoll + mod), 0, 100)

  if (!stressSplit) {
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

  if (check.bands.length !== 3) {
    throw new Error(`检定「${check.id}」stressSplit 须恰好 3 个 band（失常/正常/超常）`)
  }

  const { lowMax, highMin } = computeStressSplitEdges(state.stats.stress)
  const idx = bandIndexForScore(score, lowMax, highMin) as 0 | 1 | 2
  const band = check.bands[idx]
  const career = state.stats.career
  const iq = iqDisplayFromCareer(career)
  const baseScore = gaokaoBaseScoreFromCareer(career)
  const delta = performanceDeltaForBand(idx, rawRoll)
  const examTotalScore = clamp(baseScore + delta, 280, 750)

  return {
    checkId: check.id,
    label: check.label,
    rawRoll,
    score,
    bandLabel: band.label,
    next: band.next,
    bandEffects: band.effects,
    hideDice: true,
    iqDisplay: iq,
    baseScore,
    performanceDelta: delta,
    examTotalScore,
  }
}
