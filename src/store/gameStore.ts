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

function cloneInitial(s: Story): GlobalState {
  return structuredClone(s.initial)
}

type PendingNav = { stageId: string; sceneId: string }

type GameStore = {
  story: Story
  phase: 'title' | 'playing' | 'ending'
  rngSeed: string
  rng: ReturnType<typeof createRng>
  state: GlobalState
  stageId: string
  sceneId: string
  pendingCheck: CheckResolution | null
  pendingNav: PendingNav | null
  startGame: () => void
  goTitle: () => void
  pickChoice: (choiceId: string) => void
  dismissCheck: () => void
  restartFromEnding: () => void
  navigateAuto: (next: Next) => void
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
      pendingCheck: null,
      pendingNav: null,
    }),

  startGame: () => {
    const seed = get().rngSeed
    const rng = createRng(seed)
    let state = cloneInitial(story)
    const { stageId, sceneId } = story.meta.start
    state = enterScene(story, state, stageId, sceneId)
    set({
      rng,
      state,
      stageId,
      sceneId,
      phase: 'playing',
      pendingCheck: null,
      pendingNav: null,
    })
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
}))
