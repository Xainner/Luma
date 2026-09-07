import { create } from 'zustand'
import { applyTheme, getStoredTheme, storeTheme, type Theme } from '../lib/theme'
import {
  applyAccent,
  applyReduceMotion,
  getStoredAccent,
  getStoredReduceMotion,
  storeAccent,
  storeReduceMotion,
  type Accent,
} from '../lib/appearance'

export type View = 'chat' | 'settings'

export type SettingsSection =
  | 'general'
  | 'appearance'
  | 'connection'
  | 'models'
  | 'reasoning'
  | 'profiles'
  | 'attachments'
  | 'shortcuts'
  | 'data'
  | 'admin'
  | 'about'

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    return v === '1'
  } catch {
    return fallback
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function readCollapsed(): boolean {
  return readBool('luma.sidebarCollapsed', false)
}

interface UIState {
  view: View
  settingsSection: SettingsSection
  sidebarOpen: boolean
  /** Rail colapsado en desktop (solo iconos). Persistido. */
  sidebarCollapsed: boolean
  paletteOpen: boolean
  theme: Theme
  accent: Accent
  reduceMotion: boolean
  /** Preferencias de chat (§19). Persistidas. */
  enterToSend: boolean
  autoFollow: boolean
  showSuggestions: boolean
  goChat: () => void
  goSettings: (section?: SettingsSection) => void
  setSettingsSection: (section: SettingsSection) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setPaletteOpen: (open: boolean) => void
  togglePalette: () => void
  setTheme: (theme: Theme) => void
  setAccent: (accent: Accent) => void
  setReduceMotion: (reduce: boolean) => void
  setEnterToSend: (on: boolean) => void
  setAutoFollow: (on: boolean) => void
  setShowSuggestions: (on: boolean) => void
}

const initialAccent = typeof window === 'undefined' ? 'nebula' : getStoredAccent()
const initialMotion = typeof window === 'undefined' ? false : getStoredReduceMotion()
if (typeof window !== 'undefined') {
  applyAccent(initialAccent)
  applyReduceMotion(initialMotion)
}

/** Estado de shell (vista, sidebar, paleta, tema, prefs). Lo caliente (chats, streaming) sigue en App. */
export const useUIStore = create<UIState>((set) => ({
  view: 'chat',
  settingsSection: 'general',
  sidebarOpen: false,
  sidebarCollapsed: typeof window === 'undefined' ? false : readCollapsed(),
  paletteOpen: false,
  theme: typeof window === 'undefined' ? 'system' : getStoredTheme(),
  accent: initialAccent,
  reduceMotion: initialMotion,
  enterToSend: typeof window === 'undefined' ? true : readBool('luma.enterToSend', true),
  autoFollow: typeof window === 'undefined' ? true : readBool('luma.autoFollow', true),
  showSuggestions: typeof window === 'undefined' ? true : readBool('luma.showSuggestions', true),
  goChat: () => set({ view: 'chat', sidebarOpen: false }),
  goSettings: (section = 'general') =>
    set({ view: 'settings', sidebarOpen: false, settingsSection: section }),
  setSettingsSection: (settingsSection) => set({ settingsSection }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => {
    writeBool('luma.sidebarCollapsed', collapsed)
    set({ sidebarCollapsed: collapsed })
  },
  toggleSidebarCollapsed: () =>
    set((s) => {
      writeBool('luma.sidebarCollapsed', !s.sidebarCollapsed)
      return { sidebarCollapsed: !s.sidebarCollapsed }
    }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setTheme: (theme) => {
    storeTheme(theme)
    applyTheme(theme)
    set({ theme })
  },
  setAccent: (accent) => {
    storeAccent(accent)
    applyAccent(accent)
    set({ accent })
  },
  setReduceMotion: (reduce) => {
    storeReduceMotion(reduce)
    applyReduceMotion(reduce)
    set({ reduceMotion: reduce })
  },
  setEnterToSend: (on) => {
    writeBool('luma.enterToSend', on)
    set({ enterToSend: on })
  },
  setAutoFollow: (on) => {
    writeBool('luma.autoFollow', on)
    set({ autoFollow: on })
  },
  setShowSuggestions: (on) => {
    writeBool('luma.showSuggestions', on)
    set({ showSuggestions: on })
  },
}))
