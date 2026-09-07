/** Límites centralizados de adjuntos. Mantener sincronizado con web/src/lib/media-config.ts */
export const MEDIA_LIMITS = {
  maxImages: 6,
  maxVideos: 3,
  /** MB por video en el plan gratuito de payload JSON (fase 1). Fase 2 (uploads) lo eleva. */
  maxVideoMB: 200,
  maxImageMB: 25,
  /** Tope absoluto del body JSON (debe ser > peor caso: videos × MB + frames). */
  bodyLimitMB: 220,
  /** Límite de memoria por chat persistido (bytes de dataUrl). Lo que exceda va a uploads. */
  maxStoredBytesPerChat: 12 * 1024 * 1024,
} as const

/** Muestreo de frames por video (fase adaptativa). */
export const FRAME_SAMPLING = {
  minFrames: 2,
  maxFrames: 12,
  secondsPerFrame: 4,
  /** Frames casi idénticos (diff media por debajo) se descartan para ahorrar tokens. */
  dedupeThreshold: 12,
  thumbDim: 480,
  frameDim: 720,
  frameQuality: 0.7,
} as const

/** Estimación grosera de tokens por frame de imagen (para auto-reducción). */
export const TOKENS_PER_FRAME = 1100
