/** Capacidades por modelo (heurística local; el backend manda). */
const THINKING_RE = /qwen|qwq/i
const VISION_RE = /vision|vl|qwen/i

export function supportsThinking(model: string): boolean {
  return THINKING_RE.test(model || '')
}

export function supportsVision(model: string): boolean {
  return VISION_RE.test(model || '')
}

/** Nombre corto para chips: recorta sufijos técnicos tipo -Q4_K_M. */
export function shortModelName(model: string): string {
  const base = (model || '').split('/').pop() ?? model
  return base
    .replace(/[-_:](q\d.*|fp\d+|uncensored)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()
}

export function modelBadges(model: string): string[] {
  const badges: string[] = []
  if (supportsThinking(model)) badges.push('Thinking')
  if (supportsVision(model)) badges.push('Vision')
  if (badges.length === 0) badges.push('Text')
  return badges
}
