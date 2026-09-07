/**
 * Dimensiones de imagen leyendo SOLO headers (nunca se decodifican píxeles).
 * Soporta PNG, JPEG, GIF y WebP (VP8 / VP8L / VP8X).
 * Pensado para backfills privados: no escribe archivos ni expone contenido.
 */

export interface ImageDims {
  width: number
  height: number
}

function sane(w: number, h: number): ImageDims | null {
  if (!Number.isInteger(w) || !Number.isInteger(h)) return null
  if (w <= 0 || h <= 0 || w > 30000 || h > 30000) return null
  return { width: w, height: h }
}

function png(buf: Buffer): ImageDims | null {
  if (buf.length < 24) return null
  if (buf.readUInt32BE(12) !== 0x49484452) return null // 'IHDR'
  return sane(buf.readUInt32BE(16), buf.readUInt32BE(20))
}

function gif(buf: Buffer): ImageDims | null {
  if (buf.length < 10) return null
  const sig = buf.toString('ascii', 0, 6)
  if (sig !== 'GIF87a' && sig !== 'GIF89a') return null
  return sane(buf.readUInt16LE(6), buf.readUInt16LE(8))
}

function jpeg(buf: Buffer): ImageDims | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let pos = 2
  const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  while (pos + 4 < buf.length) {
    if (buf[pos] !== 0xff) return null
    let marker = buf[pos + 1]
    // Relleno 0xFF repetido
    while (marker === 0xff && pos + 2 < buf.length) {
      pos++
      marker = buf[pos + 1]
    }
    if (marker === 0xd9) return null // EOI sin SOF
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      pos += 2
      continue
    }
    if (pos + 4 > buf.length) return null
    const len = buf.readUInt16BE(pos + 2)
    if (len < 2 || pos + 2 + len > buf.length) return null
    if (SOF.has(marker)) {
      if (len < 7) return null
      const h = buf.readUInt16BE(pos + 5)
      const w = buf.readUInt16BE(pos + 7)
      return sane(w, h)
    }
    pos += 2 + len
  }
  return null
}

function webp(buf: Buffer): ImageDims | null {
  if (buf.length < 12) return null
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null
  let pos = 12
  while (pos + 8 <= buf.length) {
    const fourcc = buf.toString('ascii', pos, pos + 4)
    const size = buf.readUInt32LE(pos + 4)
    const data = pos + 8
    if (fourcc === 'VP8 ' && data + 10 <= buf.length) {
      // Frame tag (3) + start code (3) + w/h 14 bits LE
      const w = buf.readUInt16LE(data + 6) & 0x3fff
      const h = buf.readUInt16LE(data + 8) & 0x3fff
      return sane(w, h)
    }
    if (fourcc === 'VP8L' && data + 5 <= buf.length) {
      if (buf[data] !== 0x2f) return null
      const b0 = buf[data + 1]
      const b1 = buf[data + 2]
      const b2 = buf[data + 3]
      const b3 = buf[data + 4]
      const w = 1 + (((b1 & 0x3f) << 8) | b0)
      const h = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
      return sane(w, h)
    }
    if (fourcc === 'VP8X' && data + 7 <= buf.length) {
      // Layout VP8X: flags(1) + widthMinusOne(3 LE) + heightMinusOne(3 LE)
      const ww = 1 + (buf[data + 1] | (buf[data + 2] << 8) | (buf[data + 3] << 16))
      const hh = 1 + (buf[data + 4] | (buf[data + 5] << 8) | (buf[data + 6] << 16))
      return sane(ww, hh)
    }
    pos = data + size + (size % 2)
  }
  return null
}

/** Dimensiones desde bytes crudos (cualquier formato soportado) o null. */
export function imageDimensions(buf: Buffer): ImageDims | null {
  if (!buf || buf.length < 10) return null
  if (buf[0] === 0x89 && buf[1] === 0x50) return png(buf)
  if (buf[0] === 0xff && buf[1] === 0xd8) return jpeg(buf)
  if (buf[0] === 0x47 && buf[1] === 0x49) return gif(buf)
  if (buf[0] === 0x52 && buf[1] === 0x49) return webp(buf)
  return null
}

/** Dimensiones desde un dataUrl (`data:image/...;base64,...`) o null. */
export function dataUrlDimensions(dataUrl: string): ImageDims | null {
  if (typeof dataUrl !== 'string') return null
  const comma = dataUrl.indexOf(',')
  if (comma < 0 || !dataUrl.slice(0, comma).includes('base64')) return null
  try {
    const buf = Buffer.from(dataUrl.slice(comma + 1).replace(/\s+/g, ''), 'base64')
    return imageDimensions(buf)
  } catch {
    return null
  }
}
