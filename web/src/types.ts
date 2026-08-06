export interface AppConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  profileId: string
  language: Language
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
}

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
  images?: ImageAttachment[]
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

export const MASKED_KEY = '********'

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
