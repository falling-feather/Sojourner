import { getScene } from '@/engine/machine'
import { useGameStore } from '@/store/gameStore'
import { NarrativeView } from '@/ui/NarrativeView'

export function EndingScreen() {
  const story = useGameStore((s) => s.story)
  const stageId = useGameStore((s) => s.stageId)
  const sceneId = useGameStore((s) => s.sceneId)
  const goTitle = useGameStore((s) => s.goTitle)
  const startGame = useGameStore((s) => s.startGame)
  const state = useGameStore((s) => s.state)

  const scene = getScene(story, stageId, sceneId)
  const st = story.stages.find((s) => s.id === stageId)

  const flags = Object.entries(state.flags).filter(([, v]) => v)
  const tags = state.tags

  return (
    <div className="screen screen--ending">
      <div className="ending-frame">
        <header className="ending-hero">
          <p className="ending-hero__eyebrow">终局</p>
          <h1 className="ending-hero__title">你的一生 · 落幕</h1>
          <p className="ending-hero__sub">
            以下为摘要占位：可含关键抉择回顾、全局属性结算、开放式总结（内容由数据驱动）。
          </p>
        </header>

        <div className="ending-grid">
          <section className="ending-card" aria-labelledby="ending-flags">
            <h2 id="ending-flags" className="ending-card__h">
              决断点回顾
            </h2>
            <ul className="ending-list">
              {flags.length === 0 ? (
                <li className="ending-list__empty">本局暂无已解锁决断点标记（示意）</li>
              ) : (
                flags.map(([k]) => (
                  <li key={k} className="ending-list__item">
                    · {k}
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="ending-card" aria-labelledby="ending-tags">
            <h2 id="ending-tags" className="ending-card__h">
              延迟后果 / 标签
            </h2>
            {tags.length === 0 ? (
              <p className="ending-card__p">暂无长期标签（示意）</p>
            ) : (
              <ul className="ending-list">
                {tags.map((t) => (
                  <li key={t} className="ending-list__item">
                    · {t}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="ending-narrative-wrap">
          <NarrativeView title={st?.title} paragraphs={scene?.narrative ?? []} />
        </div>

        <div className="ending-actions">
          <button
            type="button"
            className="btn btn--primary ending-actions__primary"
            onClick={() => startGame()}
            autoFocus
          >
            再看一局
          </button>
          <button
            type="button"
            className="btn btn--ghost ending-actions__secondary"
            onClick={() => goTitle()}
          >
            返回标题
          </button>
        </div>
      </div>
    </div>
  )
}
