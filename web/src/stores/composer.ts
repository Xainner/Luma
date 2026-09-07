import { create } from 'zustand'
import type { ImageAttachment, VideoAttachment } from '../types'
import { MEDIA_LIMITS } from '../lib/media-config'
import { prepareImage } from '../lib/images'
import { prepareVideo } from '../lib/videos'
import { uploadFile } from '../lib/uploads'

interface ComposerState {
  text: string
  images: ImageAttachment[]
  videos: VideoAttachment[]
  preparing: string | null
  attachError: string
  setText: (text: string) => void
  addFiles: (list: Iterable<File>) => Promise<void>
  removeImage: (id: string) => void
  removeVideo: (id: string) => void
  clearAll: () => void
}

function revokePreview(v: VideoAttachment) {
  if (v.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(v.previewUrl)
}

/**
 * Estado del composer en store (no en el componente): la misma instancia
 * lógica sobrevive al cambio de placement centered ↔ bottom sin perder
 * draft, adjuntos ni listeners.
 */
export const useComposerStore = create<ComposerState>((set, get) => ({
  text: '',
  images: [],
  videos: [],
  preparing: null,
  attachError: '',

  setText: (text) => set({ text }),

  addFiles: async (list) => {
    const { images, videos } = get()
    const all = Array.from(list)
    const imageFiles = all.filter((f) => f.type.startsWith('image/'))
    const videoFiles = all.filter((f) => f.type.startsWith('video/'))
    if (imageFiles.length === 0 && videoFiles.length === 0) return
    set({ attachError: '' })

    const imageRoom = MEDIA_LIMITS.maxImages - images.length
    const videoRoom = MEDIA_LIMITS.maxVideos - videos.length
    const imgToAdd = imageRoom > 0 ? imageFiles.slice(0, imageRoom) : []
    const vidToAdd = videoRoom > 0 ? videoFiles.slice(0, videoRoom) : []
    const skipped: string[] = []
    if (imageFiles.length > imgToAdd.length) skipped.push('imágenes (máx 6)')
    if (videoFiles.length > vidToAdd.length) skipped.push('videos (máx 3)')
    if (imgToAdd.length === 0 && vidToAdd.length === 0) {
      set({
        attachError: `Límite alcanzado: ${skipped.join(' · ')}. Quita adjuntos para agregar más.`,
      })
      return
    }

    const errors: string[] = []
    if (skipped.length) errors.push(`Se omitieron ${skipped.join(' y ')} por límite.`)
    for (const f of imgToAdd) {
      try {
        const prepared = await prepareImage(f)
        set((s) => ({ images: [...s.images, prepared].slice(0, MEDIA_LIMITS.maxImages) }))
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `No se pudo leer ${f.name}.`)
      }
    }
    for (const f of vidToAdd) {
      set({ preparing: f.name })
      try {
        const vid = await prepareVideo(f, {
          onProgress: (done, total) => set({ preparing: `${f.name} · frame ${done}/${total}` }),
        })
        set({ preparing: `${f.name} · subiendo…` })
        try {
          const up = await uploadFile(f, (loaded, total) =>
            set({
              preparing: `${f.name} · subiendo ${Math.round((loaded / Math.max(1, total)) * 100)}%`,
            }),
          )
          vid.uploadId = up.id
        } catch (err) {
          errors.push(
            `“${f.name}” se analizará por frames pero sin playback: ${err instanceof Error ? err.message : 'subida falló.'}`,
          )
        }
        set((s) => ({ videos: [...s.videos, vid].slice(0, MEDIA_LIMITS.maxVideos) }))
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `No se pudo procesar ${f.name}.`)
      } finally {
        set({ preparing: null })
      }
    }
    if (errors.length) set({ attachError: errors.join(' ') })
  },

  removeImage: (id) => set((s) => ({ images: s.images.filter((i) => i.id !== id) })),

  removeVideo: (id) =>
    set((s) => {
      const target = s.videos.find((v) => v.id === id)
      if (target) revokePreview(target)
      return { videos: s.videos.filter((v) => v.id !== id) }
    }),

  clearAll: () =>
    set((s) => {
      s.videos.forEach(revokePreview)
      return { text: '', images: [], videos: [], preparing: null, attachError: '' }
    }),
}))
