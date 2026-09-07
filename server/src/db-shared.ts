import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type ThoughtEffort = 'off' | 'low' | 'medium' | 'high'

export interface AppConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  profileId: string
  language: 'es' | 'en'
  thinkingEffort: ThoughtEffort
  /** Override de esfuerzo por modelo exacto. */
  modelThinking: Record<string, ThoughtEffort>
}

export interface ImageAttachment {
  id: string
  name: string
  mime: string
  dataUrl: string
  size?: number
  width?: number
  height?: number
  /** Id de upload en servidor (fase 2). Si existe, dataUrl puede omitirse al persistir. */
  uploadId?: string
}

export interface VideoAttachment {
  id: string
  name: string
  mime: string
  /** Legacy: video completo en base64. Solo lectura para chats viejos; no se escribe nuevo. */
  dataUrl?: string
  frames: string[]
  thumb?: string
  duration?: number
  width?: number
  height?: number
  size?: number
  /** Id de upload en servidor (fase 2). */
  uploadId?: string
}

export interface ChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  images?: ImageAttachment[]
  videos?: VideoAttachment[]
  /** Razonamiento del modelo (deltas reasoning_content). Solo lectura/historial. */
  thinking?: string
  createdAt: number
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export type ConfigScope = 'global' | 'user'

export interface Profile {
  id: string
  name: string
  masterPrompt: string
  emoji: string
  color: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

export interface ChatMeta {
  id: string
  title: string
  updatedAt: number
}

/* ---------- Password hashing (compartido) ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), test)
}

export function checkPassword(user: { passwordHash: string }, password: string): boolean {
  return verifyPassword(password, user.passwordHash)
}

/* ---------- Config (compartido) ---------- */

export const defaultConfig: AppConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
  profileId: '',
  language: 'es',
  thinkingEffort: 'medium',
  modelThinking: {},
}

function parseModelThinking(v: unknown): Record<string, ThoughtEffort> {
  if (!v || typeof v !== 'object') return {}
  const out: Record<string, ThoughtEffort> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val === 'off' || val === 'low' || val === 'medium' || val === 'high') out[k] = val
  }
  return out
}

export function rowToConfig(r: Record<string, unknown>): AppConfig {
  return {
    baseUrl: (r.base_url as string) ?? '',
    apiKey: (r.api_key as string) ?? '',
    model: (r.model as string) ?? '',
    temperature: (r.temperature as number) ?? 0.7,
    maxTokens: (r.max_tokens as number) ?? 4096,
    systemPrompt: (r.system_prompt as string) ?? '',
    profileId: (r.profile_id as string) ?? '',
    language: r.language === 'en' ? 'en' : 'es',
    thinkingEffort:
      r.thinking_effort === 'off' ||
      r.thinking_effort === 'low' ||
      r.thinking_effort === 'medium' ||
      r.thinking_effort === 'high'
        ? r.thinking_effort
        : 'medium',
    modelThinking: parseModelThinking(
      typeof r.model_thinking === 'string'
        ? (() => {
            try {
              return JSON.parse(r.model_thinking as string)
            } catch {
              return {}
            }
          })()
        : (r.model_thinking ?? {}),
    ),
  }
}

export function makeLoadEffectiveConfig(deps: {
  loadGlobalConfig: () => Promise<AppConfig>
  getConfigScope: () => Promise<ConfigScope>
  loadUserConfig: (userId: string) => Promise<AppConfig>
}) {
  return async (user: User): Promise<AppConfig> => {
    const global = await deps.loadGlobalConfig()
    const scope = await deps.getConfigScope()
    if (scope === 'global') return { ...global }
    const userConfig = await deps.loadUserConfig(user.id)
    return {
      baseUrl: userConfig.baseUrl || global.baseUrl,
      apiKey: userConfig.apiKey || global.apiKey,
      model: userConfig.model || global.model,
      temperature: userConfig.temperature ?? global.temperature,
      maxTokens: userConfig.maxTokens ?? global.maxTokens,
      systemPrompt: global.systemPrompt,
      profileId: userConfig.profileId || global.profileId,
      language: userConfig.language || global.language,
      thinkingEffort: userConfig.thinkingEffort || global.thinkingEffort,
      modelThinking: { ...global.modelThinking, ...userConfig.modelThinking },
    }
  }
}

export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/* ---------- Row mappers (compartido) ---------- */

export function rowToProfile(r: Record<string, unknown>): Profile {
  return {
    id: r.id as string,
    name: r.name as string,
    masterPrompt: r.master_prompt as string,
    emoji: r.emoji as string,
    color: r.color as string,
  }
}
