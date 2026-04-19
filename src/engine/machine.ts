import type { Next, Story } from './schema'
import { isChoiceVisible } from './choiceVisibility'
import { applyEffects, normalizeStats } from './effects'
import { resolveThresholdCheck, type CheckResolution } from './check'
import type { GlobalState } from './types'
import type { Rng } from './rng'

export function getStage(story: Story, id: string) {
  return story.stages.find((s) => s.id === id)
}

export function getScene(story: Story, stageId: string, sceneId: string) {
  return getStage(story, stageId)?.scenes.find((sc) => sc.id === sceneId)
}

export function resolveNext(
  story: Story,
  currentStageId: string,
  n: Next,
): { stageId: string; sceneId: string } {
  if (n.kind === 'stage') {
    return { stageId: n.stageId, sceneId: n.sceneId }
  }
  const stageId = n.stageId ?? currentStageId
  if (!getStage(story, stageId)) {
    throw new Error(`resolveNext: 未知阶段 ${stageId}`)
  }
  return { stageId, sceneId: n.sceneId }
}

export type SelectChoiceResult = {
  state: GlobalState
  stageId: string
  sceneId: string
  checkResult: CheckResolution | null
}

export function selectChoice(
  story: Story,
  state: GlobalState,
  rng: Rng,
  currentStageId: string,
  currentSceneId: string,
  choiceId: string,
): SelectChoiceResult {
  const scene = getScene(story, currentStageId, currentSceneId)
  const choice = scene?.choices?.find((c) => c.id === choiceId)
  if (!choice || !isChoiceVisible(choice, state)) {
    throw new Error(`未找到或不可选：${choiceId}`)
  }

  let s = applyEffects(state, choice.effects)

  if (choice.check) {
    const res = resolveThresholdCheck(choice.check, s, rng)
    s = applyEffects(s, res.bandEffects)
    s = normalizeStats(s)
    const { stageId, sceneId } = resolveNext(story, currentStageId, res.next)
    return { state: s, stageId, sceneId, checkResult: res }
  }

  if (!choice.next) throw new Error(`选项 ${choiceId} 缺少 next`)
  s = normalizeStats(s)
  const { stageId, sceneId } = resolveNext(story, currentStageId, choice.next)
  return { state: s, stageId, sceneId, checkResult: null }
}

export function enterScene(
  story: Story,
  state: GlobalState,
  stageId: string,
  sceneId: string,
): GlobalState {
  const scene = getScene(story, stageId, sceneId)
  if (!scene) return state
  return normalizeStats(applyEffects(state, scene.onEnter))
}
