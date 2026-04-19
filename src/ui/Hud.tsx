import { useGameStore } from '@/store/gameStore'
import { healthDebtBand, stressBand, wealthBand } from '@/ui/statBands'

type Props = {
  stageTitle: string
  step: number
  total: number
  onMenuClick: () => void
}

export function Hud({ stageTitle, step, total, onMenuClick }: Props) {
  const state = useGameStore((s) => s.state)
  const stress = state.stats.stress
  const healthDebt = state.stats.healthDebt
  const wealth = state.stats.wealth

  return (
    <header className="play-topbar" role="banner">
      <div className="play-topbar__left">
        <p className="play-topbar__stage">当前阶段 · {stageTitle}</p>
        <p className="play-topbar__meta">
          时间点 {step} / {total}　·　全局状态与决断点会跨场景保留
        </p>
      </div>
      <div className="play-topbar__right">
        <div className="stat-pill" title={`压力 ${Math.round(stress)}`}>
          <span className="stat-pill__label">压力</span>
          <span className="stat-pill__value stat-pill__value--stress">
            {stressBand(stress)}
          </span>
        </div>
        <div className="stat-pill" title={`健康负债 ${Math.round(healthDebt)}`}>
          <span className="stat-pill__label">健康负债</span>
          <span className="stat-pill__value stat-pill__value--health">
            {healthDebtBand(healthDebt)}
          </span>
        </div>
        <div className="stat-pill" title={`财力 ${Math.round(wealth)}`}>
          <span className="stat-pill__label">财力</span>
          <span className="stat-pill__value stat-pill__value--wealth">
            {wealthBand(wealth)}
          </span>
        </div>
        <button
          type="button"
          className="menu-chip"
          onClick={onMenuClick}
          aria-haspopup="dialog"
        >
          <span className="menu-chip__kbd">Esc</span>
          <span className="menu-chip__label">菜单</span>
        </button>
      </div>
    </header>
  )
}
