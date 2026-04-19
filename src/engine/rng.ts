/** Mulberry32 — 可复现的 32 位 PRNG（同一 seed 得到同一序列） */
export function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h >>> 0) || 1
}

export function createRng(seed: string | number) {
  const n = typeof seed === 'number' ? seed : hashSeed(seed)
  const next01 = mulberry32(n)
  return {
    /** [0, 1) */
    next01,
    /** [0, max) 整数 */
    nextInt(max: number) {
      return Math.floor(next01() * max)
    },
    /** [min, max] 闭区间整数 */
    nextIntInclusive(min: number, max: number) {
      return min + Math.floor(next01() * (max - min + 1))
    },
    /** [0, 100] 用于检定 */
    roll100() {
      return Math.floor(next01() * 101)
    },
  }
}

export type Rng = ReturnType<typeof createRng>
