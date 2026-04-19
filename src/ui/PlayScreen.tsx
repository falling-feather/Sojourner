import { useCallback, useEffect, useRef, useState } from 'react'
import { getScene } from '@/engine/machine'
import { visibleChoices } from '@/engine/choiceVisibility'
import { useGameStore } from '@/store/gameStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
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

/** 多选项：淡出后再提交，需与 CSS transition 大致对齐 */
const CHOICE_FADE_OUT_MS = 420

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
  const [typewriterDone, setTypewriterDone] = useState(false)
  const [choicesReveal, setChoicesReveal] = useState(false)
  const [pickPhase, setPickPhase] = useState<'idle' | 'exiting'>('idle')

  const reducedMotion = usePrefersReducedMotion()
  const pickTimerRef = useRef<number | null>(null)

  const scene = getScene(story, stageId, sceneId)
  const st = story.stages.find((s) => s.id === stageId)
  const { step, total } = getStoryProgress(story, stageId, sceneId)

  const sceneKey = `${stageId}::${sceneId}`
  const narrativeParas = scene?.narrative ?? []

  const closeAllMenus = useCallback(() => setMenu('none'), [])

  useEffect(() => {
    setTypewriterDone(false)
    setChoicesReveal(false)
    setPickPhase('idle')
    if (pickTimerRef.current) {
      window.clearTimeout(pickTimerRef.current)
      pickTimerRef.current = null
    }
  }, [sceneKey])

  useEffect(() => {
    if (!typewriterDone) {
      setChoicesReveal(false)
      return
    }
    const list = scene ? visibleChoices(scene.choices, state) : []
    if (list.length === 0) {
      setChoicesReveal(true)
      return
    }
    const delay = reducedMotion ? 0 : 90
    const t = window.setTimeout(() => setChoicesReveal(true), delay)
    return () => window.clearTimeout(t)
  }, [typewriterDone, scene, state, reducedMotion])

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

  const handlePickAttempt = useCallback(
    (id: string) => {
      if (!scene) return
      const overlayOpen = menu !== 'none'
      if (pendingCheck || overlayOpen || pickPhase !== 'idle') return

      const list = visibleChoices(scene.choices, state)
      if (list.length <= 1 || reducedMotion) {
        pickChoice(id)
        return
      }

      setPickPhase('exiting')
      if (pickTimerRef.current) window.clearTimeout(pickTimerRef.current)
      pickTimerRef.current = window.setTimeout(() => {
        pickTimerRef.current = null
        pickChoice(id)
        setPickPhase('idle')
      }, CHOICE_FADE_OUT_MS)
    },
    [scene, state, menu, pendingCheck, pickPhase, reducedMotion, pickChoice],
  )

  if (!scene) {
    return (
      <div className="screen screen--error">
        <p>
          未找到场景：{stageId} / {sceneId}
        </p>
        <button type="button" className="btn btn--ghost" onClick={goTitle}>
          返回标题
        </button>
      </div>
    )
  }

  const overlayOpen = menu !== 'none'
  const choiceDisabled = !!pendingCheck || overlayOpen
  const listLen = visibleChoices(scene.choices, state).length

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
          <NarrativeView
            title={st?.title}
            paragraphs={narrativeParas}
            sceneKey={sceneKey}
            onTypingComplete={() => setTypewriterDone(true)}
            reducedMotion={reducedMotion}
            msPerChar={reducedMotion ? 0 : 22}
          />
          <ChoiceList
            choices={scene.choices}
            state={state}
            onPick={handlePickAttempt}
            disabled={choiceDisabled}
            reveal={choicesReveal && typewriterDone && listLen > 0}
            pickPhase={pickPhase}
            reducedMotion={reducedMotion}
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
