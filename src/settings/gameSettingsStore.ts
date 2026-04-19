const STORAGE_KEY = 'sojourner.settings.v1'

export type TextSpeedId = 'slow' | 'normal' | 'fast' | 'instant'

export type GameSettingsState = {
  bgmEnabled: boolean
  bgmVolume: number
  textSpeed: TextSpeedId
}

const defaultState: GameSettingsState = {
  bgmEnabled: true,
  bgmVolume: 0.42,
  textSpeed: 'normal',
}

function load(): GameSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const p = JSON.parse(raw) as Partial<GameSettingsState>
    return {
      bgmEnabled: typeof p.bgmEnabled === 'boolean' ? p.bgmEnabled : defaultState.bgmEnabled,
      bgmVolume:
        typeof p.bgmVolume === 'number' &&
        p.bgmVolume >= 0 &&
        p.bgmVolume <= 1
          ? p.bgmVolume
          : defaultState.bgmVolume,
      textSpeed:
        p.textSpeed === 'slow' ||
        p.textSpeed === 'normal' ||
        p.textSpeed === 'fast' ||
        p.textSpeed === 'instant'
          ? p.textSpeed
          : defaultState.textSpeed,
    }
  } catch {
    return { ...defaultState }
  }
}

function save(s: GameSettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

let memory = load()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function patchGameSettings(patch: Partial<GameSettingsState>) {
  memory = { ...memory, ...patch }
  save(memory)
  emit()
}

export function getGameSettingsSnapshot(): GameSettingsState {
  return memory
}

export function subscribeGameSettings(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function textSpeedToMsPerChar(speed: TextSpeedId): number {
  switch (speed) {
    case 'slow':
      return 34
    case 'normal':
      return 22
    case 'fast':
      return 13
    case 'instant':
      return 0
    default:
      return 22
  }
}
