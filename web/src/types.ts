export interface AppConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
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
