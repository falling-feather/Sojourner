import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { GameSettingsProvider } from '@/settings/gameSettings'
import { GlobalBgmProvider } from '@/audio/GlobalBgmProvider'
import { TitleScreen } from '@/ui/TitleScreen'
import { PlayScreen } from '@/ui/PlayScreen'
import { EndingScreen } from '@/ui/EndingScreen'
import { GmScreen } from '@/ui/GmScreen'
import { BgmDock } from '@/ui/BgmDock'
import './App.css'

function App() {
  const phase = useGameStore((s) => s.phase)

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      if (q.get('gm') === '1') {
        useGameStore.getState().enterGm()
      }
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <GameSettingsProvider>
      <GlobalBgmProvider>
        <div className="app">
          {phase === 'title' ? <TitleScreen /> : null}
          {phase === 'playing' ? <PlayScreen /> : null}
          {phase === 'ending' ? <EndingScreen /> : null}
          {phase === 'gm' ? <GmScreen /> : null}
        </div>
        {phase === 'playing' || phase === 'gm' ? <BgmDock /> : null}
      </GlobalBgmProvider>
    </GameSettingsProvider>
  )
}

export default App
