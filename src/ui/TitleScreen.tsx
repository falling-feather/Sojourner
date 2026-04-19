import { useEffect, useLayoutEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/** 开屏第二阶段延迟（毫秒），相对上一版再慢一倍 */
const TITLE_BELOW_DELAY_MS = 2080

export function TitleScreen() {
  const startGame = useGameStore((s) => s.startGame)
  const reduced = usePrefersReducedMotion()
  const [heroIn, setHeroIn] = useState(false)

  useLayoutEffect(() => {
    if (reduced) setHeroIn(true)
  }, [reduced])

  useEffect(() => {
    if (reduced) return
    const t = window.setTimeout(() => setHeroIn(true), TITLE_BELOW_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [reduced])

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
    <div className={`screen screen--title ${heroIn ? 'screen--title--ready' : ''}`}>
      <div className="title-hero">
        <h1 className="title-hero__h">
          <span className="title-hero__h-text">过客</span>
        </h1>
        <div className="title-hero__below">
          <p className="title-hero__en" lang="en">
            Sojourner
          </p>
          <p className="title-hero__eyebrow">◆ 人生似河，择岸而行 ◆</p>
          <button
            type="button"
            className="title-hero__cta"
            onClick={startGame}
            autoFocus
          >
            开始人生
          </button>
          <p className="title-hero__hint">按 Enter 亦可开始</p>
        </div>
      </div>
      <p className="title-credits" aria-label="作者署名">
        落入白川的羽 · Falling-feather
      </p>
    </div>
  )
}
