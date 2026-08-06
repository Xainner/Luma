import type { ImageAttachment } from '../types'

const MAX_DIM = 1080

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

function downscale(dataUrl: string, maxDim: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      if (scale >= 1) return resolve(dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export async function prepareImage(file: File): Promise<ImageAttachment> {
  const dataUrl = await fileToDataUrl(file)
  const optimized = await downscale(dataUrl, MAX_DIM)
  const mime = optimized.slice(5, optimized.indexOf(';')) || file.type || 'image/png'
  return {
    id: crypto.randomUUID(),
    name: file.name || 'imagen',
    mime,
    dataUrl: optimized,
  }
}
