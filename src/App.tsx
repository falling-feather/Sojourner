import { useGameStore } from '@/store/gameStore'
import { TitleScreen } from '@/ui/TitleScreen'
import { PlayScreen } from '@/ui/PlayScreen'
import { EndingScreen } from '@/ui/EndingScreen'
import './App.css'

function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="app">
      {phase === 'title' ? <TitleScreen /> : null}
      {phase === 'playing' ? <PlayScreen /> : null}
      {phase === 'ending' ? <EndingScreen /> : null}
    </div>
  )
}

export default App
