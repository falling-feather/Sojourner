import { createContext, useContext } from 'react'

export type GlobalBgmContextValue = {
  isPlaying: boolean
  currentTitle: string
  bgmEnabled: boolean
  toggleFromDock: () => void
}

export const GlobalBgmCtx = createContext<GlobalBgmContextValue | null>(null)

export function useGlobalBgm(): GlobalBgmContextValue {
  const v = useContext(GlobalBgmCtx)
  if (!v) {
    throw new Error('useGlobalBgm must be used within GlobalBgmProvider')
  }
  return v
}
