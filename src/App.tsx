import { useGameStore } from '@/store/gameStore'
import { GameSettingsProvider } from '@/settings/gameSettings'
import { GlobalBgmProvider } from '@/audio/GlobalBgmProvider'
import { TitleScreen } from '@/ui/TitleScreen'
import { PlayScreen } from '@/ui/PlayScreen'
import { EndingScreen } from '@/ui/EndingScreen'
import './App.css'

function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <GameSettingsProvider>
      <GlobalBgmProvider>
        <div className="app">
          {phase === 'title' ? <TitleScreen /> : null}
          {phase === 'playing' ? <PlayScreen /> : null}
          {phase === 'ending' ? <EndingScreen /> : null}
        </div>
      </GlobalBgmProvider>
    </GameSettingsProvider>
  )
}

export default App
