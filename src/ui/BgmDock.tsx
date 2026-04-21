import { useGlobalBgm } from '@/audio/globalBgmContext'

/**
 * 游玩 / GM 阶段右下角唱片控件；音频仍由 GlobalBgmProvider 全局播放，
 * 标题与终局页不挂载本组件，避免遮挡画面，但 BGM 不中断。
 */
export function BgmDock() {
  const { isPlaying, currentTitle, bgmEnabled, toggleFromDock } =
    useGlobalBgm()

  const title = currentTitle
  const useMarquee = title.length > 18

  return (
    <div className="bgm-dock" aria-label="背景音乐">
      <button
        type="button"
        className={`bgm-dock__disc ${isPlaying && bgmEnabled ? 'bgm-dock__disc--spin' : ''}`}
        onClick={toggleFromDock}
        title={bgmEnabled ? '点击关闭音乐' : '点击开启音乐'}
        aria-pressed={bgmEnabled}
      >
        <span className="bgm-dock__disc-groove" aria-hidden="true" />
        <span className="bgm-dock__disc-label" aria-hidden="true">
          {bgmEnabled ? '♪' : '‖'}
        </span>
      </button>
      <div className="bgm-dock__meta">
        <span className="bgm-dock__label">BGM</span>
        <div className="bgm-dock__title-wrap" title={title}>
          {useMarquee ? (
            <div className="bgm-dock__marquee">
              <div className="bgm-dock__marquee-inner">
                <span>{title}</span>
                <span aria-hidden="true"> · {title}</span>
              </div>
            </div>
          ) : (
            <span className="bgm-dock__title">{title}</span>
          )}
        </div>
      </div>
    </div>
  )
}
