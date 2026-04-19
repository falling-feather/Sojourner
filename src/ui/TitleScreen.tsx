import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function TitleScreen() {
  const title = useGameStore((s) => s.story.meta.title)
  const est = useGameStore((s) => s.story.meta.estimatedMinutes)
  const startGame = useGameStore((s) => s.startGame)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        startGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startGame])

  return (
    <div className="screen screen--title">
      <div className="title-card">
        <p className="title-card__eyebrow">◆ 人生似河，择岸而行 ◆</p>
        <h1 className="title-card__h">{title}</h1>
        <p className="title-card__sub">
          叙事向网页游戏 · 多阶段关键节点 · 具 Galgame 层次的状态与检定
        </p>
        <p className="title-card__meta">
          单局约 {est[0]}–{est[1]} 分钟 · 桌面端 · 数字键映射选项
        </p>
        <button
          type="button"
          className="btn btn--primary title-card__cta"
          onClick={startGame}
          autoFocus
        >
          开始人生
        </button>
        <p className="title-card__hint">按 Enter 亦可开始</p>
      </div>
    </div>
  )
}
