import { useCallback, useEffect, useState } from 'react'
import { getScene } from '@/engine/machine'
import { useGameStore } from '@/store/gameStore'
import { Hud } from '@/ui/Hud'
import { NarrativeView } from '@/ui/NarrativeView'
import { ChoiceList } from '@/ui/ChoiceList'
import { CheckToast } from '@/ui/CheckToast'
import { getStoryProgress } from '@/ui/storyProgress'
import {
  ConfirmDialog,
  PauseMenu,
  SettingsPanel,
  type MenuLayer,
} from '@/ui/GameMenuLayer'

export function PlayScreen() {
  const story = useGameStore((s) => s.story)
  const stageId = useGameStore((s) => s.stageId)
  const sceneId = useGameStore((s) => s.sceneId)
  const state = useGameStore((s) => s.state)
  const pendingCheck = useGameStore((s) => s.pendingCheck)
  const pickChoice = useGameStore((s) => s.pickChoice)
  const dismissCheck = useGameStore((s) => s.dismissCheck)
  const navigateAuto = useGameStore((s) => s.navigateAuto)
  const goTitle = useGameStore((s) => s.goTitle)
  const startGame = useGameStore((s) => s.startGame)

  const [menu, setMenu] = useState<MenuLayer>('none')

  const scene = getScene(story, stageId, sceneId)
  const st = story.stages.find((s) => s.id === stageId)
  const { step, total } = getStoryProgress(story, stageId, sceneId)

  const closeAllMenus = useCallback(() => setMenu('none'), [])

  useEffect(() => {
    const onEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && pendingCheck) {
        e.preventDefault()
        dismissCheck()
      }
    }
    window.addEventListener('keydown', onEnter)
    return () => window.removeEventListener('keydown', onEnter)
  }, [pendingCheck, dismissCheck])

  useEffect(() => {
    if (!scene?.autoNext || pendingCheck) return
    const ms = scene.autoNext.delayMs ?? 600
    const t = window.setTimeout(() => {
      navigateAuto(scene.autoNext!.next)
    }, ms)
    return () => window.clearTimeout(t)
  }, [scene, navigateAuto, pendingCheck, stageId, sceneId])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (pendingCheck) return
      e.preventDefault()
      setMenu((m) => {
        if (m === 'none') return 'pause'
        if (m === 'settings') return 'pause'
        if (m === 'confirmRestart' || m === 'confirmTitle') return 'pause'
        return 'none'
      })
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [pendingCheck])

  if (!scene) {
    return (
      <div className="screen screen--error">
        <p>未找到场景：{stageId} / {sceneId}</p>
        <button type="button" className="btn btn--ghost" onClick={goTitle}>
          返回标题
        </button>
      </div>
    )
  }

  const overlayOpen = menu !== 'none'
  const choiceDisabled = !!pendingCheck || overlayOpen

  return (
    <div className="screen screen--play">
      <div className="play-frame">
        <Hud
          stageTitle={st?.title ?? '—'}
          step={step}
          total={total}
          onMenuClick={() => {
            if (!pendingCheck) setMenu('pause')
          }}
        />
        <div className="play-body">
          <NarrativeView title={st?.title} paragraphs={scene.narrative} />
          <ChoiceList
            choices={scene.choices}
            state={state}
            onPick={pickChoice}
            disabled={choiceDisabled}
          />
        </div>
      </div>

      <CheckToast
        open={!!pendingCheck}
        result={pendingCheck}
        onDismiss={dismissCheck}
      />

      {menu === 'pause' ? (
        <PauseMenu
          onResume={closeAllMenus}
          onSettings={() => setMenu('settings')}
          onRestart={() => setMenu('confirmRestart')}
          onBackToTitle={() => setMenu('confirmTitle')}
        />
      ) : null}
      {menu === 'settings' ? (
        <SettingsPanel onBack={() => setMenu('pause')} />
      ) : null}
      {menu === 'confirmRestart' ? (
        <ConfirmDialog
          variant="restart"
          onCancel={() => setMenu('pause')}
          onConfirm={() => {
            startGame()
            closeAllMenus()
          }}
        />
      ) : null}
      {menu === 'confirmTitle' ? (
        <ConfirmDialog
          variant="title"
          onCancel={() => setMenu('pause')}
          onConfirm={() => {
            goTitle()
            closeAllMenus()
          }}
        />
      ) : null}
    </div>
  )
}
