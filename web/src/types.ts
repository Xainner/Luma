export type ThoughtEffort = 'off' | 'low' | 'medium' | 'high'

export interface AppConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  profileId: string
  language: Language
  thinkingEffort: ThoughtEffort
  modelThinking: Record<string, ThoughtEffort>
}

export interface Profile {
  id: string
  name: string
  masterPrompt: string
  emoji: string
  color: string
}

export interface ImageAttachment {
  id: string
  name: string
  mime: string
  dataUrl: string
  size?: number
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
  uploadId?: string
  /** URL efímera de preview (objectURL en memoria). NO persistir ni enviar. */
  previewUrl?: string
}

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
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

export interface ChatMeta {
  id: string
  title: string
  updatedAt: number
}

export type ConfigScope = 'global' | 'user'

export type Language = 'es' | 'en'

export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

export interface AdminUser extends User {
  createdAt: number
}

export interface ConfigMeta {
  scope: ConfigScope
  isAdmin: boolean
}
