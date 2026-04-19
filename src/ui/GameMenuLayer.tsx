import { useGameSettings } from '@/settings/gameSettings'
import type { TextSpeedId } from '@/settings/gameSettingsStore'

export type MenuLayer =
  | 'none'
  | 'pause'
  | 'settings'
  | 'confirmRestart'
  | 'confirmTitle'

type PauseMenuProps = {
  onResume: () => void
  onSettings: () => void
  onRestart: () => void
  onBackToTitle: () => void
}

export function PauseMenu({
  onResume,
  onSettings,
  onRestart,
  onBackToTitle,
}: PauseMenuProps) {
  return (
    <div
      className="overlay overlay--dim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="modal-card modal-card--pause">
        <p className="modal-card__eyebrow">PAUSED</p>
        <h2 id="pause-title" className="modal-card__h">
          游戏已暂停
        </h2>
        <p className="modal-card__sub">
          你可以稍作整理，再回到故事里。
        </p>
        <div className="modal-card__actions modal-card__actions--stack">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={onResume}
            autoFocus
          >
            继续游戏
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={onSettings}
          >
            设置
          </button>
          <button
            type="button"
            className="btn btn--danger-ghost btn--block"
            onClick={onRestart}
          >
            重开人生
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={onBackToTitle}
          >
            返回标题
          </button>
        </div>
        <p className="modal-card__hint">
          Esc 关闭菜单 · 「重开」与「返回标题」将先经过确认
        </p>
      </div>
    </div>
  )
}

const TEXT_SPEEDS: { id: TextSpeedId; label: string }[] = [
  { id: 'slow', label: '慢' },
  { id: 'normal', label: '标准' },
  { id: 'fast', label: '快' },
  { id: 'instant', label: '瞬间' },
]

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { settings, set } = useGameSettings()

  return (
    <div
      className="overlay overlay--dim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="modal-card modal-card--wide">
        <div className="settings-head">
          <button type="button" className="btn btn--ghost btn--compact" onClick={onBack}>
            ← 返回游戏
          </button>
          <h2 id="settings-title" className="settings-head__title">
            设置
          </h2>
          <span className="settings-head__spacer" aria-hidden="true" />
        </div>
        <p className="settings-intro">
          以下选项会立即保存到本机浏览器。不会改变你已做出的剧情决断——它们仍在本局内生效。
        </p>
        <div className="settings-section">
          <h3 className="settings-section__h">配乐（游玩界面）</h3>
          <label className="settings-row">
            <span className="settings-row__label">启用背景音乐</span>
            <input
              type="checkbox"
              className="settings-toggle"
              checked={settings.bgmEnabled}
              onChange={(e) => set({ bgmEnabled: e.target.checked })}
            />
          </label>
          <label className="settings-row settings-row--col">
            <span className="settings-row__label">配乐音量</span>
            <input
              type="range"
              className="settings-range"
              min={0}
              max={1}
              step={0.02}
              value={settings.bgmVolume}
              disabled={!settings.bgmEnabled}
              onChange={(e) => set({ bgmVolume: Number(e.target.value) })}
              aria-valuetext={`${Math.round(settings.bgmVolume * 100)}%`}
            />
            <span className="settings-range__val">{Math.round(settings.bgmVolume * 100)}%</span>
          </label>
          <p className="settings-section__hint">
            关闭后可通过游玩页右下角唱片再次开启。音量仅影响配乐，不含系统音量。
          </p>
        </div>
        <div className="settings-section">
          <h3 className="settings-section__h">叙事文字速度</h3>
          <div className="settings-segment" role="group" aria-label="文字速度">
            {TEXT_SPEEDS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={
                  settings.textSpeed === id
                    ? 'settings-segment__btn settings-segment__btn--active'
                    : 'settings-segment__btn'
                }
                onClick={() => set({ textSpeed: id })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="settings-section__hint">
            「瞬间」将直接显示整段文本（等同无障碍减少动效时的表现）。
          </p>
        </div>
        <div className="settings-foot">
          <button type="button" className="btn btn--primary" onClick={onBack}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}

type ConfirmProps = {
  variant: 'restart' | 'title'
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ variant, onCancel, onConfirm }: ConfirmProps) {
  const isRestart = variant === 'restart'
  const title = isRestart ? '重开人生？' : '返回标题界面？'
  const tag = isRestart ? '请再想一想' : '离开当前一局'
  const primary = isRestart ? '确认重开' : '仍要返回'
  return (
    <div
      className="overlay overlay--dim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="modal-card modal-card--confirm">
        <p className={`modal-card__tag ${isRestart ? 'modal-card__tag--warn' : ''}`}>
          {tag}
        </p>
        <h2 id="confirm-title" className="modal-card__h">
          {title}
        </h2>
        <p className="modal-card__body">
          人生的机会无比珍贵，每一次决断都应当做好准备。
          {isRestart
            ? ' 重开将结束本局旅程，未存档的进度将随之消失。'
            : ' 返回标题将结束本局进度，请谨慎选择。'}
        </p>
        <p className="modal-card__fineprint">
          {isRestart
            ? '若仍希望重新出发，请确认；否则返回暂停菜单。'
            : '若尚未准备好离开，可留在游戏继续当前人生。'}
        </p>
        <div className="modal-card__row">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            {isRestart ? '返回' : '留在游戏'}
          </button>
          <button
            type="button"
            className={isRestart ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={onConfirm}
            autoFocus
          >
            {primary}
          </button>
        </div>
      </div>
    </div>
  )
}
