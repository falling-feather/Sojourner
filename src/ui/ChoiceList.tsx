import { useEffect, type CSSProperties } from 'react'
import type { Choice } from '@/engine/schema'
import { visibleChoices } from '@/engine/choiceVisibility'
import type { GlobalState } from '@/engine/types'

type Props = {
  choices: Choice[] | undefined
  state: GlobalState
  onPick: (id: string) => void
  disabled?: boolean
  reveal?: boolean
  pickPhase?: 'idle' | 'exiting'
  reducedMotion?: boolean
}

export function ChoiceList({
  choices,
  state,
  onPick,
  disabled,
  reveal = true,
  pickPhase = 'idle',
  reducedMotion = false,
}: Props) {
  const list = visibleChoices(choices, state)
  const blocked = disabled || pickPhase !== 'idle'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (blocked || list.length === 0) return
      const n = Number(e.key)
      if (!Number.isFinite(n) || n < 1 || n > 9) return
      const ch = list[n - 1]
      if (ch) {
        e.preventDefault()
        onPick(ch.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [blocked, list, onPick])

  if (list.length === 0) return null

  /** 叙事未结束时保持占位隐藏，避免未加 enter 类时选项先闪现再被动画重置 */
  const pendingHide = !reveal && !reducedMotion
  const showEnter = reveal && !reducedMotion
  const exiting = pickPhase === 'exiting' && !reducedMotion

  return (
    <div className="choice-list" role="group" aria-label="选项">
      <ul
        className={[
          'choice-list__ul',
          pendingHide ? 'choice-list__ul--pending' : '',
          showEnter ? 'choice-list__ul--enter' : '',
          exiting ? 'choice-list__ul--exiting' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {list.map((c, i) => (
          <li
            key={c.id}
            className="choice-list__li"
            style={
              showEnter
                ? ({ '--stagger': `${i * 110}ms` } as CSSProperties)
                : undefined
            }
          >
            <button
              type="button"
              className="choice-list__btn"
              data-choice-id={c.id}
              disabled={blocked}
              onClick={() => onPick(c.id)}
            >
              <span className="choice-list__kbd" aria-hidden="true">
                {i + 1}
              </span>
              <span className="choice-list__text">{c.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
