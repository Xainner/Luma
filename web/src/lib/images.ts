import type { ImageAttachment } from '../types'
import { uuid } from './uuid'
import { MEDIA_LIMITS } from './media-config'

const MAX_DIM = 1080

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

interface Scaled {
  dataUrl: string
  width: number
  height: number
}

function downscale(dataUrl: string, maxDim: number): Promise<Scaled> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      if (scale >= 1) return resolve({ dataUrl, width, height })
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve({ dataUrl, width, height })
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), width, height })
    }
    img.onerror = () => resolve({ dataUrl, width: 0, height: 0 })
    img.src = dataUrl
  })
}

export async function prepareImage(file: File): Promise<ImageAttachment> {
  if (file.size > MEDIA_LIMITS.maxImageMB * 1024 * 1024) {
    throw new Error(`“${file.name}” supera el límite de ${MEDIA_LIMITS.maxImageMB} MB por imagen.`)
  }
  const dataUrl = await fileToDataUrl(file)
  const optimized = await downscale(dataUrl, MAX_DIM)
  const mime =
    optimized.dataUrl.slice(5, optimized.dataUrl.indexOf(';')) || file.type || 'image/png'
  return {
    id: uuid(),
    name: file.name || 'imagen',
    mime,
    dataUrl: optimized.dataUrl,
    size: file.size,
    width: optimized.width || undefined,
    height: optimized.height || undefined,
  }
}
