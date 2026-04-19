import { useCallback, useEffect, useRef, useState } from 'react'
import { BGM_TRACKS, bgmUrl } from '@/config/bgm'
import { useGameSettings } from '@/settings/gameSettings'

/** 仅游玩页：右下角唱片 + 曲名（过长则轮播） */
export function BgmDock() {
  const { settings, set } = useGameSettings()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const track = BGM_TRACKS[trackIndex % BGM_TRACKS.length]

  const tryPlay = useCallback(async () => {
    const a = audioRef.current
    if (!a || !settings.bgmEnabled) return
    a.volume = settings.bgmVolume
    try {
      await a.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [settings.bgmEnabled, settings.bgmVolume])

  useEffect(() => {
    const t = BGM_TRACKS[trackIndex % BGM_TRACKS.length]
    const a = new Audio(bgmUrl(t))
    a.loop = false
    audioRef.current = a
    const onEnded = () => {
      setTrackIndex((i) => (i + 1) % BGM_TRACKS.length)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    a.addEventListener('ended', onEnded)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    return () => {
      a.pause()
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      audioRef.current = null
    }
  }, [trackIndex])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = settings.bgmVolume
    let cancelled = false
    if (settings.bgmEnabled) {
      queueMicrotask(() => {
        if (!cancelled) void tryPlay()
      })
    } else {
      a.pause()
    }
    return () => {
      cancelled = true
    }
  }, [settings.bgmEnabled, settings.bgmVolume, tryPlay, trackIndex])

  const onDiscClick = useCallback(() => {
    if (!settings.bgmEnabled) {
      set({ bgmEnabled: true })
      return
    }
    if (!isPlaying) {
      void tryPlay()
      return
    }
    set({ bgmEnabled: false })
  }, [settings.bgmEnabled, isPlaying, set, tryPlay])

  const title = track.title
  const useMarquee = title.length > 18

  return (
    <div className="bgm-dock" aria-label="背景音乐">
      <button
        type="button"
        className={`bgm-dock__disc ${isPlaying && settings.bgmEnabled ? 'bgm-dock__disc--spin' : ''}`}
        onClick={onDiscClick}
        title={settings.bgmEnabled ? '点击关闭音乐' : '点击开启音乐'}
        aria-pressed={settings.bgmEnabled}
      >
        <span className="bgm-dock__disc-groove" aria-hidden="true" />
        <span className="bgm-dock__disc-label" aria-hidden="true">
          {settings.bgmEnabled ? '♪' : '‖'}
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
