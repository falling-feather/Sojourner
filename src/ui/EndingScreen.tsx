import { getScene } from '@/engine/machine'
import { useGameStore } from '@/store/gameStore'
import { NarrativeView } from '@/ui/NarrativeView'
import { EndingStatsHex } from '@/ui/EndingStatsHex'

/** 决断点 key → 简短中文说明（未知 key 仍显示原名） */
const FLAG_LABELS: Record<string, string> = {
  gk_tier: '高考发挥段位（正常及以上）',
  academic: '学术/科研志向已确认',
  married: '已婚',
  parent: '已育儿',
  freedom_path: '离开原本城市、换活法',
}

function labelFlag(key: string): string {
  return FLAG_LABELS[key] ?? key
}

export function EndingScreen() {
  const story = useGameStore((s) => s.story)
  const stageId = useGameStore((s) => s.stageId)
  const sceneId = useGameStore((s) => s.sceneId)
  const goTitle = useGameStore((s) => s.goTitle)
  const startGame = useGameStore((s) => s.startGame)
  const playerName = useGameStore((s) => s.playerName)
  const state = useGameStore((s) => s.state)

  const scene = getScene(story, stageId, sceneId)
  const st = story.stages.find((s) => s.id === stageId)

  const flags = Object.entries(state.flags).filter(([, v]) => v)
  const tags = state.tags

  const endingTheme = scene?.title?.trim()
  const heroSub = endingTheme
    ? `本局以「${endingTheme}」收束。下方为关键决断点、长期行为标签与本局六维得分示意；最末是本篇结局正文。`
    : '下方为关键决断点、长期行为标签与本局六维得分示意；最末是本篇结局正文。'

  return (
    <div className="screen screen--ending screen--ending--in">
      <div className="ending-frame">
        <header className="ending-hero">
          <p className="ending-hero__eyebrow">终局</p>
          <h1 className="ending-hero__title">你的一生 · 落幕</h1>
          {playerName ? (
            <p className="ending-hero__sub" style={{ marginTop: 8 }}>
              {playerName}，你的结局如下。
            </p>
          ) : null}
          <p className="ending-hero__sub">{heroSub}</p>
          <EndingStatsHex state={state} />
        </header>

        <div className="ending-grid">
          <section className="ending-card" aria-labelledby="ending-flags">
            <h2 id="ending-flags" className="ending-card__h">
              决断点回顾
            </h2>
            <ul className="ending-list">
              {flags.length === 0 ? (
                <li className="ending-list__empty">
                  本局尚未留下已解锁的决断点（剧情里通过关键选择写入的标志会列在此处）。
                </li>
              ) : (
                flags.map(([k]) => (
                  <li key={k} className="ending-list__item">
                    · {labelFlag(k)}
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
              <p className="ending-card__p ending-card__p--muted">
                暂无长期行为标签（例如熬夜、读研等累积习惯会显示于此）。
              </p>
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
          <NarrativeView
            sceneKey={`${stageId}::${sceneId}::end`}
            title={st?.title}
            paragraphs={scene?.narrative ?? []}
            skipTypewriter
          />
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
