import { useEffect, useRef } from 'react'
import type { Choice } from '@/engine/schema'
import { visibleChoices } from '@/engine/choiceVisibility'
import type { GlobalState } from '@/engine/types'

type Props = {
  choices: Choice[] | undefined
  state: GlobalState
  onPick: (id: string) => void
  disabled?: boolean
}

export function ChoiceList({ choices, state, onPick, disabled }: Props) {
  const list = visibleChoices(choices, state)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || list.length === 0) return
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
  }, [disabled, list, onPick])

  if (list.length === 0) return null

  return (
    <div className="choice-list" ref={rootRef} role="group" aria-label="选项">
      <ul className="choice-list__ul">
        {list.map((c, i) => (
          <li key={c.id} className="choice-list__li">
            <button
              type="button"
              className="choice-list__btn"
              disabled={disabled}
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
