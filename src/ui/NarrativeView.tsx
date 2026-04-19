import { useEffect, useRef, useState } from 'react'

type Props = {
  title?: string
  paragraphs: string[]
  sceneKey: string
  onTypingComplete?: () => void
  msPerChar?: number
  reducedMotion?: boolean
  /** 为 true 时直接显示全文（如结局页） */
  skipTypewriter?: boolean
}

export function NarrativeView({
  title,
  paragraphs,
  sceneKey,
  onTypingComplete,
  msPerChar = 22,
  reducedMotion = false,
  skipTypewriter = false,
}: Props) {
  const [shown, setShown] = useState<string[]>(() =>
    paragraphs.length ? paragraphs.map(() => '') : [],
  )
  const doneRef = useRef(false)
  const onCompleteRef = useRef(onTypingComplete)
  onCompleteRef.current = onTypingComplete

  useEffect(() => {
    doneRef.current = false
    if (paragraphs.length === 0) {
      setShown([])
      queueMicrotask(() => {
        if (!doneRef.current) {
          doneRef.current = true
          onCompleteRef.current?.()
        }
      })
      return
    }

    if (reducedMotion || skipTypewriter) {
      setShown([...paragraphs])
      queueMicrotask(() => {
        if (!doneRef.current) {
          doneRef.current = true
          onCompleteRef.current?.()
        }
      })
      return
    }

    setShown(paragraphs.map(() => ''))
    let pi = 0
    let ci = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (pi >= paragraphs.length) {
        if (!doneRef.current) {
          doneRef.current = true
          onCompleteRef.current?.()
        }
        return
      }
      const text = paragraphs[pi]
      if (ci >= text.length) {
        pi += 1
        ci = 0
        timer = setTimeout(tick, msPerChar * 2)
        return
      }
      setShown((prev) => {
        const next = [...prev]
        next[pi] = text.slice(0, ci + 1)
        return next
      })
      ci += 1
      timer = setTimeout(tick, msPerChar)
    }

    timer = setTimeout(tick, 120)
    return () => clearTimeout(timer)
  }, [sceneKey, paragraphs.join('\n\n'), msPerChar, reducedMotion, skipTypewriter])

  const typing =
    !reducedMotion &&
    !skipTypewriter &&
    paragraphs.length > 0 &&
    paragraphs.some((full, i) => (shown[i] ?? '').length < full.length)

  return (
    <article
      className={`narrative ${typing ? 'narrative--typing' : ''}`}
      aria-live="polite"
    >
      {title ? <h2 className="narrative__stage">{title}</h2> : null}
      {paragraphs.map((_, i) => (
        <p key={i} className="narrative__p">
          {shown[i] ?? ''}
        </p>
      ))}
    </article>
  )
}
