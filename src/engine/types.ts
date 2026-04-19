import type { StatId } from './schema'

export const STAT_IDS = [
  'stress',
  'healthDebt',
  'support',
  'wealth',
  'career',
  'luck',
] as const satisfies readonly StatId[]

export type GlobalState = {
  stats: Record<StatId, number>
  flags: Record<string, boolean>
  tags: string[]
}

export type GamePhase = 'title' | 'playing' | 'ending'
