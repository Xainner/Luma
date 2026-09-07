import { FRAME_SAMPLING, TOKENS_PER_FRAME } from './media-config'

/**
 * Plan puro (sin DOM): dados duración y presupuesto de tokens, decide
 * cuántos frames extraer y en qué timestamps. Testeable en Node.
 */
export function planFrameTimes(
  durationSec: number,
  opts?: { maxTokens?: number; maxFrames?: number },
): number[] {
  const dur = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0
  const hardMax = Math.min(
    FRAME_SAMPLING.maxFrames,
    Math.max(1, Math.floor(opts?.maxFrames ?? FRAME_SAMPLING.maxFrames)),
  )
  let count = Math.min(
    hardMax,
    Math.max(FRAME_SAMPLING.minFrames, Math.round(dur / FRAME_SAMPLING.secondsPerFrame)),
  )
  if (opts?.maxTokens && opts.maxTokens > 0) {
    count = Math.min(count, Math.max(1, Math.floor(opts.maxTokens / TOKENS_PER_FRAME)))
  }
  if (dur <= 0) return [0].slice(0, count)
  return Array.from({ length: count }, (_, i) => (dur * (i + 0.5)) / count)
}

export function estimateFramesTokens(frameCount: number): number {
  return Math.max(0, Math.floor(frameCount)) * TOKENS_PER_FRAME
}
