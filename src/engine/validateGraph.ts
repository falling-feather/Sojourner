import { StorySchema, type Story } from './schema'

function sceneKey(stageId: string, sceneId: string) {
  return `${stageId}::${sceneId}`
}

/** 解析并校验剧情图：指针、选项必填 next、检定区间覆盖 */
export function parseStory(raw: unknown): Story {
  const story = StorySchema.parse(raw)
  validateStoryGraph(story)
  return story
}

export function validateStoryGraph(story: Story): void {
  const scenes = new Set<string>()
  for (const st of story.stages) {
    for (const sc of st.scenes) {
      scenes.add(sceneKey(st.id, sc.id))
    }
  }

  const { stageId: startStage, sceneId: startScene } = story.meta.start
  if (!scenes.has(sceneKey(startStage, startScene))) {
    throw new Error(`meta.start 指向不存在的场景：${startStage} / ${startScene}`)
  }

  for (const st of story.stages) {
    for (const sc of st.scenes) {
      if (sc.autoNext) {
        assertNextExists(story, scenes, st.id, sc.autoNext.next)
      }
      if (sc.choices) {
        for (const ch of sc.choices) {
          if (!ch.check && !ch.next) {
            throw new Error(
              `场景 ${st.id}/${sc.id} 选项「${ch.id}」缺少 next（无检定时必填）`,
            )
          }
          if (ch.next) assertNextExists(story, scenes, st.id, ch.next)
          if (ch.check) {
            for (const b of ch.check.bands) {
              assertNextExists(story, scenes, st.id, b.next)
            }
            if (ch.check.bandMode === 'stressSplit') {
              if (ch.check.bands.length !== 3) {
                throw new Error(
                  `场景 ${st.id}/${sc.id} 检定「${ch.check.id}」bandMode stressSplit 须恰好 3 条 band（失常/正常/超常）`,
                )
              }
            } else {
              validateBandsCover0to100(st.id, sc.id, ch.check.id, ch.check.bands)
            }
          }
        }
      }
    }
  }
}

function validateBandsCover0to100(
  stageId: string,
  sceneId: string,
  checkId: string,
  bands: { min: number; max: number }[],
) {
  const sorted = [...bands].sort((a, b) => a.min - b.min)
  if (sorted[0].min > 0 || sorted[sorted.length - 1].max < 100) {
    console.warn(
      `[剧情校验] 检定 ${checkId}（${stageId}/${sceneId}）区间可能未覆盖 0–100`,
    )
  }
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min > sorted[i - 1].max + 1) {
      console.warn(
        `[剧情校验] 检定 ${checkId} 在 ${sorted[i - 1].max} 与 ${sorted[i].min} 之间存在间隙`,
      )
    }
  }
}

function assertNextExists(
  story: Story,
  scenes: Set<string>,
  currentStageId: string,
  next: { kind: 'scene' | 'stage'; sceneId: string; stageId?: string },
) {
  let targetStage: string
  if (next.kind === 'stage') {
    if (!next.stageId) {
      throw new Error('next.kind 为 stage 时必须提供 stageId')
    }
    targetStage = next.stageId
  } else {
    targetStage = next.stageId ?? currentStageId
  }
  const targetScene = next.sceneId
  if (!story.stages.some((s) => s.id === targetStage)) {
    throw new Error(`next 指向不存在的阶段：${targetStage}`)
  }
  if (!scenes.has(sceneKey(targetStage, targetScene))) {
    throw new Error(`next 指向不存在的场景：${targetStage} / ${targetScene}`)
  }
}
