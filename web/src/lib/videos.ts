import type { VideoAttachment } from '../types'
import { uuid } from './uuid'
import { FRAME_SAMPLING, MEDIA_LIMITS } from './media-config'
import { planFrameTimes } from './frame-plan'

export interface PrepareVideoOpts {
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
  /** Presupuesto de tokens para frames; recorta el conteo si se excede. */
  maxTokens?: number
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => reject(new Error('El navegador no pudo decodificar el video.'))
    video.src = url
  })
}

function drawScaled(
  video: HTMLVideoElement,
  maxDim: number,
  quality: number,
): { dataUrl: string; width: number; height: number } {
  const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight))
  const width = Math.max(1, Math.round(video.videoWidth * scale))
  const height = Math.max(1, Math.round(video.videoHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Sin contexto 2D.')
  ctx.drawImage(video, 0, 0, width, height)
  return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height }
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      video.onseeked = null
      video.onerror = null
      reject(new Error('Timeout buscando frame.'))
    }, 8000)
    video.onseeked = () => {
      clearTimeout(timeout)
      video.onseeked = null
      video.onerror = null
      resolve()
    }
    video.onerror = () => {
      clearTimeout(timeout)
      video.onseeked = null
      video.onerror = null
      reject(new Error('Error buscando frame.'))
    }
    video.currentTime = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.05)))
  })
}

/** Diferencia media (0-255) entre dos dataURL JPEG usando miniatura 16x16. */
async function frameDiff(a: string, b: string): Promise<number> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('frame'))
      img.src = src
    })
  const tiny = (img: HTMLImageElement) => {
    const c = document.createElement('canvas')
    c.width = 16
    c.height = 16
    const ctx = c.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Sin contexto 2D.')
    ctx.drawImage(img, 0, 0, 16, 16)
    return ctx.getImageData(0, 0, 16, 16).data
  }
  const [ia, ib] = await Promise.all([load(a), load(b)])
  const da = tiny(ia)
  const db = tiny(ib)
  let sum = 0
  const n = da.length / 4
  for (let i = 0; i < da.length; i += 4) {
    sum +=
      Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])
  }
  return sum / (n * 3)
}

export async function prepareVideo(file: File, opts?: PrepareVideoOpts): Promise<VideoAttachment> {
  const maxBytes = MEDIA_LIMITS.maxVideoMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(
      `“${file.name}” pesa ${(file.size / 1048576).toFixed(0)} MB y supera el límite de ${MEDIA_LIMITS.maxVideoMB} MB.`,
    )
  }
  const url = URL.createObjectURL(file)
  try {
    const video = await loadVideo(url)
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
    const times = planFrameTimes(duration, { maxTokens: opts?.maxTokens })
    const frames: string[] = []
    let dims = { width: 0, height: 0 }
    for (let i = 0; i < times.length; i++) {
      opts?.signal?.throwIfAborted()
      await seek(video, times[i])
      const shot = drawScaled(video, FRAME_SAMPLING.frameDim, FRAME_SAMPLING.frameQuality)
      dims = { width: shot.width, height: shot.height }
      // Dedupe: descarta frames casi idénticos al último conservado
      if (frames.length > 0) {
        try {
          const diff = await frameDiff(frames[frames.length - 1], shot.dataUrl)
          if (diff < FRAME_SAMPLING.dedupeThreshold) {
            opts?.onProgress?.(i + 1, times.length)
            continue
          }
        } catch {
          /* si falla la comparación, conserva el frame */
        }
      }
      frames.push(shot.dataUrl)
      opts?.onProgress?.(i + 1, times.length)
    }
    if (frames.length === 0) throw new Error('No se pudieron extraer frames del video.')
    // Thumb desde el primer frame conservado
    const thumbImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('thumb'))
      img.src = frames[0]
    })
    const tc = document.createElement('canvas')
    const tscale = Math.min(1, FRAME_SAMPLING.thumbDim / Math.max(thumbImg.width, thumbImg.height))
    tc.width = Math.max(1, Math.round(thumbImg.width * tscale))
    tc.height = Math.max(1, Math.round(thumbImg.height * tscale))
    tc.getContext('2d')?.drawImage(thumbImg, 0, 0, tc.width, tc.height)
    return {
      id: uuid(),
      name: file.name || 'video',
      mime: file.type || 'video/mp4',
      frames,
      thumb: tc.toDataURL('image/jpeg', 0.7),
      duration,
      width: dims.width,
      height: dims.height,
      size: file.size,
      previewUrl: url, // efímero: NO persistir (se limpia al enviar)
    }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

/** Quita campos efímeros antes de persistir/enviar. */
export function stripVideoEphemeral<T extends { videos?: VideoAttachment[] }>(msg: T): T {
  if (!msg.videos?.length) return msg
  return {
    ...msg,
    videos: msg.videos.map((v) => {
      const { previewUrl: _drop, ...rest } = v
      return rest
    }),
  }
}
