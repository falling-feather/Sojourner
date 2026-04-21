import { create } from 'zustand'
import storyRaw from '../../content/story.json'
import {
  enterScene,
  getScene,
  parseStory,
  resolveNext,
  selectChoice,
} from '@/engine'
import type { Next, Story } from '@/engine/schema'
import type { GlobalState } from '@/engine/types'
import type { CheckResolution } from '@/engine/check'
import { createRng } from '@/engine/rng'

const story = parseStory(storyRaw)

/** 每局新 seed，避免固定 default seed 导致连续多局检定结果完全相同 */
function newRunSeed(): string {
  const c = globalThis.crypto
  if (c?.randomUUID) {
    return c.randomUUID()
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

function cloneInitial(s: Story): GlobalState {
  return structuredClone(s.initial)
}

type PendingNav = { stageId: string; sceneId: string }

type GameStore = {
  story: Story
  phase: 'title' | 'playing' | 'ending' | 'gm'
  rngSeed: string
  rng: ReturnType<typeof createRng>
  playerName: string | null
  state: GlobalState
  stageId: string
  sceneId: string
  pendingCheck: CheckResolution | null
  pendingNav: PendingNav | null
  startGame: () => void
  goTitle: () => void
  setPlayerName: (name: string) => void
  enterGm: () => void
  pickChoice: (choiceId: string) => void
  dismissCheck: () => void
  restartFromEnding: () => void
  navigateAuto: (next: Next) => void
  gmSetStats: (next: Partial<GlobalState['stats']>) => void
  gmToggleFlag: (key: string) => void
  gmSetTags: (tags: string[]) => void
  gmGo: (stageId: string, sceneId: string) => void
}

function applyArrival(
  draft: Omit<
    GameStore,
    | 'startGame'
    | 'goTitle'
    | 'pickChoice'
    | 'dismissCheck'
    | 'restartFromEnding'
    | 'navigateAuto'
  >,
  stageId: string,
  sceneId: string,
) {
  const s = enterScene(draft.story, draft.state, stageId, sceneId)
  const scene = getScene(draft.story, stageId, sceneId)
  const phase: 'playing' | 'ending' = scene?.isEnding ? 'ending' : 'playing'
  return {
    state: s,
    stageId,
    sceneId,
    phase,
    pendingCheck: null,
    pendingNav: null,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  story,
  phase: 'title',
  rngSeed: story.meta.rngSeedDefault ?? 'life',
  rng: createRng(story.meta.rngSeedDefault ?? 'life'),
  playerName: null,
  state: cloneInitial(story),
  stageId: story.meta.start.stageId,
  sceneId: story.meta.start.sceneId,
  pendingCheck: null,
  pendingNav: null,

  goTitle: () =>
    set({
      phase: 'title',
      state: cloneInitial(story),
      rngSeed: story.meta.rngSeedDefault ?? 'life',
      rng: createRng(story.meta.rngSeedDefault ?? 'life'),
      stageId: story.meta.start.stageId,
      sceneId: story.meta.start.sceneId,
      playerName: null,
      pendingCheck: null,
      pendingNav: null,
    }),

  startGame: () => {
    const seed = newRunSeed()
    const rng = createRng(seed)
    let state = cloneInitial(story)
    const { stageId, sceneId } = story.meta.start
    state = enterScene(story, state, stageId, sceneId)
    set({
      rng,
      rngSeed: seed,
      state,
      stageId,
      sceneId,
      phase: 'playing',
      playerName: null,
      pendingCheck: null,
      pendingNav: null,
    })
  },

  setPlayerName: (name: string) => {
    const v = name.trim()
    set({ playerName: v.length ? v.slice(0, 24) : null })
  },

  enterGm: () => {
    set({ phase: 'gm' })
  },

  pickChoice: (choiceId: string) => {
    const g = get()
    const r = selectChoice(
      g.story,
      g.state,
      g.rng,
      g.stageId,
      g.sceneId,
      choiceId,
    )
    if (r.checkResult) {
      set({
        state: r.state,
        pendingCheck: r.checkResult,
        pendingNav: { stageId: r.stageId, sceneId: r.sceneId },
      })
      return
    }
    set({
      ...applyArrival(
        { ...g, state: r.state },
        r.stageId,
        r.sceneId,
      ),
    })
  },

  dismissCheck: () => {
    const g = get()
    if (!g.pendingCheck || !g.pendingNav) return
    const { stageId, sceneId } = g.pendingNav
    set({
      ...applyArrival({ ...g, state: g.state }, stageId, sceneId),
    })
  },

  restartFromEnding: () => {
    get().goTitle()
  },

  navigateAuto: (next: Next) => {
    const g = get()
    const { stageId, sceneId } = resolveNext(g.story, g.stageId, next)
    set({
      ...applyArrival({ ...g }, stageId, sceneId),
    })
  },

  gmSetStats: (next) => {
    const g = get()
    set({
      state: {
        ...g.state,
        stats: { ...g.state.stats, ...next },
      },
    })
  },

  gmToggleFlag: (key) => {
    const g = get()
    const cur = g.state.flags[key] === true
    set({
      state: {
        ...g.state,
        flags: { ...g.state.flags, [key]: !cur },
      },
    })
  },

  gmSetTags: (tags) => {
    const g = get()
    const uniq = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
    set({
      state: {
        ...g.state,
        tags: uniq,
      },
    })
  },

  gmGo: (stageId: string, sceneId: string) => {
    const g = get()
    set({ ...applyArrival({ ...g }, stageId, sceneId), phase: 'playing' })
  },
}))
