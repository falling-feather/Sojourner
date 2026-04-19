import type { Story } from '@/engine/schema'

export function getStoryProgress(
  story: Story,
  stageId: string,
  sceneId: string,
): { step: number; total: number } {
  let total = 0
  for (const st of story.stages) {
    total += st.scenes.length
  }
  let step = 0
  for (const st of story.stages) {
    for (const sc of st.scenes) {
      step += 1
      if (st.id === stageId && sc.id === sceneId) {
        return { step, total }
      }
    }
  }
  return { step: Math.max(1, step), total: Math.max(1, total) }
}
