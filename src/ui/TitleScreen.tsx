import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/** 「过客」主字动画开始后，再出现英文的间隔（毫秒） */
const TITLE_EN_DELAY_MS = 420
/** 英文出现后再停顿，再出现眉题 / CTA 等 */
const TITLE_REST_AFTER_EN_MS = 620

export function TitleScreen() {
  const startGame = useGameStore((s) => s.startGame)
  const reduced = usePrefersReducedMotion()
  const [enIn, setEnIn] = useState(reduced)
  const [restIn, setRestIn] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const tEn = window.setTimeout(() => setEnIn(true), TITLE_EN_DELAY_MS)
    const tRest = window.setTimeout(
      () => setRestIn(true),
      TITLE_EN_DELAY_MS + TITLE_REST_AFTER_EN_MS,
    )
    return () => {
      window.clearTimeout(tEn)
      window.clearTimeout(tRest)
    }
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
    <div className={`screen screen--title ${restIn ? 'screen--title--credits' : ''}`}>
      <div className="title-hero">
        <h1 className="title-hero__h">
          <span className="title-hero__h-text">过客</span>
        </h1>
        <p className={`title-hero__en ${enIn ? 'title-hero__en--in' : ''}`} lang="en">
          Sojourner
        </p>
        <div className={`title-hero__rest ${restIn ? 'title-hero__rest--in' : ''}`}>
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
