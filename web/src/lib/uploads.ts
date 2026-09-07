import { getToken } from './api'

export interface UploadResult {
  id: string
  name: string
  mime: string
  size: number
}

/** Sube el binario original con progreso real (fetch no da upload progress). */
export function uploadFile(
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/uploads')
    xhr.setRequestHeader('x-luma-filename', encodeURIComponent(file.name || 'archivo'))
    xhr.setRequestHeader('x-luma-mime', file.type || 'application/octet-stream')
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total)
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as UploadResult & { error?: string }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data)
        else reject(new Error(data?.error ?? `Subida falló (${xhr.status}).`))
      } catch {
        reject(new Error(`Subida falló (${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new Error('Sin conexión con el servidor.'))
    xhr.onabort = () => reject(new Error('Subida cancelada.'))
    xhr.send(file)
  })
}

/** URL autenticada para <video>/<img> (no pueden mandar headers). */
export function uploadUrl(id: string): string {
  const token = getToken()
  return token ? `/api/uploads/${id}?token=${encodeURIComponent(token)}` : `/api/uploads/${id}`
}
