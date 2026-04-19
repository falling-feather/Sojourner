import { useGlobalBgm } from '@/audio/globalBgmContext'

/** 仅游玩页：右下角唱片 + 曲名（过长则轮播）；音频由 GlobalBgmProvider 统一管理 */
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
