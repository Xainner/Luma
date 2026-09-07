import { create } from 'zustand'

export type View = 'chat' | 'settings'

interface UIState {
  view: View
  sidebarOpen: boolean
  paletteOpen: boolean
  goChat: () => void
  goSettings: () => void
  setSidebarOpen: (open: boolean) => void
  setPaletteOpen: (open: boolean) => void
  togglePalette: () => void
}

/** Estado de shell (vista, sidebar, paleta). Lo caliente (chats, streaming) sigue en App. */
export const useUIStore = create<UIState>((set) => ({
  view: 'chat',
  sidebarOpen: false,
  paletteOpen: false,
  goChat: () => set({ view: 'chat', sidebarOpen: false }),
  goSettings: () => set({ view: 'settings', sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
}))
