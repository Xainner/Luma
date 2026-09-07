import { create } from 'zustand'
import { applyTheme, getStoredTheme, storeTheme, type Theme } from '../lib/theme'

export type View = 'chat' | 'settings'

interface UIState {
  view: View
  sidebarOpen: boolean
  /** Rail colapsado en desktop (solo iconos). */
  sidebarCollapsed: boolean
  paletteOpen: boolean
  theme: Theme
  goChat: () => void
  goSettings: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setPaletteOpen: (open: boolean) => void
  togglePalette: () => void
  setTheme: (theme: Theme) => void
}

/** Estado de shell (vista, sidebar, paleta, tema). Lo caliente (chats, streaming) sigue en App. */
export const useUIStore = create<UIState>((set) => ({
  view: 'chat',
  sidebarOpen: false,
  sidebarCollapsed: false,
  paletteOpen: false,
  theme: typeof window === 'undefined' ? 'system' : getStoredTheme(),
  goChat: () => set({ view: 'chat', sidebarOpen: false }),
  goSettings: () => set({ view: 'settings', sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setTheme: (theme) => {
    storeTheme(theme)
    applyTheme(theme)
    set({ theme })
  },
}))
