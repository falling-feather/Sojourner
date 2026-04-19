import type { CheckResolution } from '@/engine/check'

type Props = {
  open: boolean
  result: CheckResolution | null
  onDismiss: () => void
}

export function CheckToast({ open, result, onDismiss }: Props) {
  if (!open || !result) return null

  return (
    <div
      className="overlay overlay--check"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-toast-title"
    >
      <div className="modal-card modal-card--check">
        <p className="modal-card__eyebrow modal-card__eyebrow--accent">关键节点 · 概率检定</p>
        <h2 id="check-toast-title" className="modal-card__h">
          {result.label}
        </h2>
        <p className="check-result-line">
          <span className="check-result-line__lbl">检定结果</span>
          <span className="check-result-line__val">{result.bandLabel}</span>
        </p>
        <p className="modal-card__fineprint">
          骰值 {result.rawRoll} · 结算分 {result.score}
        </p>
        <button type="button" className="btn btn--primary btn--block" onClick={onDismiss}>
          继续剧情（Enter）
        </button>
      </div>
    </div>
  )
}
