import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { BGM_TRACKS, bgmUrl } from '@/config/bgm'
import { getGameSettingsSnapshot } from '@/settings/gameSettingsStore'
import { useGameSettings } from '@/settings/gameSettings'
import { GlobalBgmCtx } from '@/audio/globalBgmContext'

/**
 * 全局唯一 BGM：自进入应用起保持同一 Audio 实例，不因换周目/切场景而重开。
 * 需包在 GameSettingsProvider 之内。
 */
export function GlobalBgmProvider({ children }: { children: ReactNode }) {
  const { settings, set } = useGameSettings()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const track = BGM_TRACKS[trackIndex % BGM_TRACKS.length]

  /** 浏览器自动播放策略：在任意首次用户手势时尝试恢复播放 */
  useEffect(() => {
    const tryResume = () => {
      const snap = getGameSettingsSnapshot()
      if (!snap.bgmEnabled) return
      const a = audioRef.current
      if (a?.paused) void a.play().catch(() => {})
    }
    window.addEventListener('pointerdown', tryResume, { capture: true })
    window.addEventListener('keydown', tryResume, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', tryResume, { capture: true })
      window.removeEventListener('keydown', tryResume, { capture: true })
    }
  }, [])

  useEffect(() => {
    const a = new Audio()
    a.preload = 'auto'
    audioRef.current = a
    const onEnded = () =>
      setTrackIndex((i) => (i + 1) % BGM_TRACKS.length)
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
  }, [])

  /** 仅切歌时换 src / load（不随音量变化重载） */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const t = BGM_TRACKS[trackIndex % BGM_TRACKS.length]
    a.src = bgmUrl(t)
    a.load()
    const s = getGameSettingsSnapshot()
    a.volume = s.bgmVolume
    if (s.bgmEnabled) {
      queueMicrotask(() => {
        void a.play().catch(() => setIsPlaying(false))
      })
    }
  }, [trackIndex])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = settings.bgmVolume
  }, [settings.bgmVolume])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (!settings.bgmEnabled) {
      a.pause()
      return
    }
    queueMicrotask(() => {
      void a.play().catch(() => setIsPlaying(false))
    })
  }, [settings.bgmEnabled])

  const toggleFromDock = useCallback(() => {
    if (!settings.bgmEnabled) {
      set({ bgmEnabled: true })
      return
    }
    if (!isPlaying) {
      const a = audioRef.current
      if (a) void a.play().catch(() => {})
      return
    }
    set({ bgmEnabled: false })
  }, [settings.bgmEnabled, isPlaying, set])

  const value = useMemo(
    () => ({
      isPlaying,
      currentTitle: track.title,
      bgmEnabled: settings.bgmEnabled,
      toggleFromDock,
    }),
    [isPlaying, track.title, settings.bgmEnabled, toggleFromDock],
  )

  return (
    <GlobalBgmCtx.Provider value={value}>{children}</GlobalBgmCtx.Provider>
  )
}
