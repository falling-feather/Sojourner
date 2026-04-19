/* eslint-disable react-refresh/only-export-components -- Provider 与 useGameSettings 同文件 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import {
  getGameSettingsSnapshot,
  patchGameSettings,
  subscribeGameSettings,
  type GameSettingsState,
} from '@/settings/gameSettingsStore'

const Ctx = createContext<{
  settings: GameSettingsState
  set: (patch: Partial<GameSettingsState>) => void
} | null>(null)

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    subscribeGameSettings,
    getGameSettingsSnapshot,
    getGameSettingsSnapshot,
  )
  const set = useCallback((patch: Partial<GameSettingsState>) => {
    patchGameSettings(patch)
  }, [])
  const v = useMemo(() => ({ settings, set }), [settings, set])
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}

export function useGameSettings() {
  const v = useContext(Ctx)
  if (!v) {
    throw new Error('useGameSettings must be used within GameSettingsProvider')
  }
  return v
}
