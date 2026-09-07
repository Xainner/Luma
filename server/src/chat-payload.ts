import type { AppConfig, ChatMessage } from './db-shared.js'

export type ThoughtEffort = 'off' | 'low' | 'medium' | 'high'

export const THOUGHT_EFFORTS: ThoughtEffort[] = ['off', 'low', 'medium', 'high']

export function normalizeEffort(v: unknown): ThoughtEffort {
  return v === 'off' || v === 'low' || v === 'medium' || v === 'high' ? v : 'medium'
}

/* ---------- Capability map (verificado con spike contra api.xainner.com/v1) ----------
 * Upstream = llama.cpp server (b10236) sirviendo Qwen3.
 * - `enable_thinking: false` → desactiva el thinking (rápido, contenido directo).
 * - `reasoning_effort` / `thinking_budget` / `reasoning.effort` → CUELGAN el worker
 *   (timeout). NUNCA enviarlos: whitelist estricta, solo `enable_thinking`.
 * - Los deltas SSE usan `reasoning_content` además de `content`.
 * - El thinking consume `max_tokens`: hay que dejar aire con floors por nivel.
 */
const THINKING_CAPABLE = /qwen|qwq/i

export function supportsThinking(model: string): boolean {
  return THINKING_CAPABLE.test(model || '')
}

/** Piso de max_tokens por nivel: el thinking se come el presupuesto de salida. */
const EFFORT_TOKEN_FLOOR: Record<Exclude<ThoughtEffort, 'off'>, number> = {
  low: 1024,
  medium: 4096,
  high: 8192,
}

/** Hint de sistema por nivel (Qwen3 lo respeta de forma débil, pero ayuda). */
const EFFORT_HINT: Record<Exclude<ThoughtEffort, 'off'>, string> = {
  low: 'Piensa de forma muy breve antes de responder.',
  medium: '',
  high: 'Tómate el tiempo necesario para razonar a fondo antes de responder.',
}

export function resolveEffort(config: AppConfig, model: string): ThoughtEffort {
  const perModel = config.modelThinking?.[model]
  if (perModel && THOUGHT_EFFORTS.includes(perModel)) return perModel
  return normalizeEffort(config.thinkingEffort)
}

/** Hint de sistema para un nivel (componer antes de construir el payload). */
export function effortSystemHint(effort: ThoughtEffort): string {
  return effort === 'off' ? '' : EFFORT_HINT[effort]
}

export interface ChatPayload {
  model: string
  messages: Array<Record<string, unknown>>
  temperature: number
  max_tokens: number
  stream: true
  enable_thinking?: boolean
}

export function toApiMessages(messages: ChatMessage[], systemPrompt: string) {
  const out: Array<Record<string, unknown>> = []
  if (systemPrompt.trim()) {
    out.push({ role: 'system', content: systemPrompt.trim() })
  }
  for (const m of messages) {
    if (m.role === 'system') continue
    const hasImages = m.role === 'user' && !!m.images?.length
    const hasVideos = m.role === 'user' && !!m.videos?.length
    if (hasImages || hasVideos) {
      out.push({
        role: 'user',
        content: [
          { type: 'text', text: m.content },
          ...(m.images ?? []).map((img) => ({
            type: 'image_url',
            image_url: { url: img.dataUrl },
          })),
          ...(m.videos ?? []).flatMap((v) =>
            v.frames.map((f) => ({ type: 'image_url', image_url: { url: f } })),
          ),
        ],
      })
    } else {
      out.push({ role: m.role, content: m.content })
    }
  }
  return out
}

/**
 * Construye el payload para el upstream aplicando el nivel de thinking.
 * Devuelve también el hint de sistema para componerlo con el system prompt.
 */
export function buildChatPayload(
  messages: ChatMessage[],
  systemPrompt: string,
  opts: { model: string; temperature: number; maxTokens: number; effort: ThoughtEffort },
): { payload: ChatPayload; extraSystem: string } {
  const max_tokens =
    opts.effort === 'off'
      ? opts.maxTokens
      : Math.max(opts.maxTokens, EFFORT_TOKEN_FLOOR[opts.effort])
  const payload: ChatPayload = {
    model: opts.model,
    messages: toApiMessages(messages, systemPrompt),
    temperature: opts.temperature,
    max_tokens,
    stream: true,
  }
  let extraSystem = ''
  if (opts.effort !== 'off' && supportsThinking(opts.model)) {
    payload.enable_thinking = true
    extraSystem = EFFORT_HINT[opts.effort]
  } else if (opts.effort === 'off' && supportsThinking(opts.model)) {
    payload.enable_thinking = false
  }
  // Modelos sin thinking soportado: sin params extra (los desconocidos cuelgan el worker).
  return { payload, extraSystem }
}
