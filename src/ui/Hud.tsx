type Props = {
  stageTitle: string
  onMenuClick: () => void
}

export function Hud({ stageTitle, onMenuClick }: Props) {
  return (
    <header className="play-topbar" role="banner">
      <div className="play-topbar__left">
        <p className="play-topbar__stage">当前阶段 · {stageTitle}</p>
      </div>
      <div className="play-topbar__right">
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
