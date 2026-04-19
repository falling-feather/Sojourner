type Props = {
  title?: string
  paragraphs: string[]
}

export function NarrativeView({ title, paragraphs }: Props) {
  return (
    <article className="narrative" aria-live="polite">
      {title ? <h2 className="narrative__stage">{title}</h2> : null}
      {paragraphs.map((p, i) => (
        <p key={i} className="narrative__p">
          {p}
        </p>
      ))}
    </article>
  )
}
