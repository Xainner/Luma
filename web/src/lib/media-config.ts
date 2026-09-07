/** Límites centralizados de adjuntos. Mantener sincronizado con server/src/media-config.ts */
export const MEDIA_LIMITS = {
  maxImages: 6,
  maxVideos: 3,
  maxVideoMB: 200,
  maxImageMB: 25,
  maxStoredBytesPerChat: 12 * 1024 * 1024,
} as const

export const FRAME_SAMPLING = {
  minFrames: 2,
  maxFrames: 12,
  secondsPerFrame: 4,
  dedupeThreshold: 12,
  thumbDim: 480,
  frameDim: 720,
  frameQuality: 0.7,
} as const

export const TOKENS_PER_FRAME = 1100
