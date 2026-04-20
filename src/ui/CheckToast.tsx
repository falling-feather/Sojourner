import type { CheckResolution } from '@/engine/check'

type Props = {
  open: boolean
  result: CheckResolution | null
  onDismiss: () => void
}

export function CheckToast({ open, result, onDismiss }: Props) {
  if (!open || !result) return null

  const gaokao = result.hideDice === true

  return (
    <div
      className="overlay overlay--check"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-toast-title"
    >
      <div className="modal-card modal-card--check">
        <p className="modal-card__eyebrow modal-card__eyebrow--accent">
          {gaokao ? '关键节点 · 高考' : '关键节点 · 概率检定'}
        </p>
        <h2 id="check-toast-title" className="modal-card__h">
          {result.label}
        </h2>
        <p className="check-result-line">
          <span className="check-result-line__lbl">发挥档位</span>
          <span className="check-result-line__val">{result.bandLabel}</span>
        </p>
        {gaokao &&
        result.iqDisplay != null &&
        result.baseScore != null &&
        result.performanceDelta != null &&
        result.examTotalScore != null ? (
          <div className="check-gaokao-summary">
            <p className="check-gaokao-summary__row">
              <span className="check-gaokao-summary__k">叙事智商（学业积淀）</span>
              <span className="check-gaokao-summary__v">{result.iqDisplay}</span>
            </p>
            <p className="check-gaokao-summary__row">
              <span className="check-gaokao-summary__k">卷面基准分</span>
              <span className="check-gaokao-summary__v">{result.baseScore}</span>
            </p>
            <p className="check-gaokao-summary__row">
              <span className="check-gaokao-summary__k">临场波动</span>
              <span className="check-gaokao-summary__v">
                {result.performanceDelta > 0 ? '+' : ''}
                {result.performanceDelta}
              </span>
            </p>
            <p className="check-gaokao-summary__row check-gaokao-summary__row--total">
              <span className="check-gaokao-summary__k">折算总分（叙事）</span>
              <span className="check-gaokao-summary__v">{result.examTotalScore}</span>
            </p>
          </div>
        ) : (
          <p className="modal-card__fineprint">
            骰值 {result.rawRoll} · 结算分 {result.score}
          </p>
        )}
        <button type="button" className="btn btn--primary btn--block" onClick={onDismiss}>
          继续剧情（Enter）
        </button>
      </div>
    </div>
  )
}
