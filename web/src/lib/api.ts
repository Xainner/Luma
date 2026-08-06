import type { AppConfig, Chat, ChatMessage, ChatMeta } from '../types'

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    if (data?.error) return data.error
  } catch {
    /* fall through */
  }
  return `Error ${res.status}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (typeof init?.body === 'string' && init.body.length > 0) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<T>
}

export async function getConfig(): Promise<AppConfig> {
  const data = await request<{ config: AppConfig }>('/api/config')
  return data.config
}

export async function saveConfig(config: AppConfig): Promise<AppConfig> {
  const data = await request<{ config: AppConfig }>('/api/config', {
    method: 'POST',
    body: JSON.stringify(config),
  })
  return data.config
}

export async function discoverModels(baseUrl?: string, apiKey?: string): Promise<string[]> {
  const headers: Record<string, string> = {}
  if (baseUrl?.trim()) headers['x-luma-base'] = baseUrl.trim()
  if (apiKey?.trim()) headers['x-luma-key'] = apiKey.trim()
  const data = await request<{ models: string[] }>('/api/models', { headers })
  return data.models
}

export interface StreamRequest {
  messages: ChatMessage[]
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  signal?: AbortSignal
}

export async function* streamChat(req: StreamRequest): AsyncGenerator<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal: req.signal,
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (!res.body) throw new Error('El servidor no devolvió streaming.')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  function handleLine(line: string): string | undefined {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return undefined
    const payload = trimmed.slice(5).trim()
    if (payload === '[DONE]' || !payload) return undefined
    let json: {
      choices?: Array<{ delta?: { content?: string } }>
      error?: string
    }
    try {
      json = JSON.parse(payload) as typeof json
    } catch {
      /* keep-alive or partial frame, ignore */
      return undefined
    }
    if (json.error) throw new Error(json.error)
    const delta = json.choices?.[0]?.delta?.content
    return typeof delta === 'string' && delta ? delta : undefined
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const delta = handleLine(line)
      if (typeof delta === 'string') yield delta
    }
  }

  const rest = buffer.trim()
  if (rest) {
    const delta = handleLine(rest)
    if (typeof delta === 'string') yield delta
  }
}

export async function listChats(): Promise<ChatMeta[]> {
  const data = await request<{ chats: ChatMeta[] }>('/api/chats')
  return data.chats
}

export async function createChat(): Promise<Chat> {
  const data = await request<{ chat: Chat }>('/api/chats', { method: 'POST' })
  return data.chat
}

export async function getChat(id: string): Promise<Chat> {
  const data = await request<{ chat: Chat }>(`/api/chats/${id}`)
  return data.chat
}

export async function updateChat(chat: Chat): Promise<void> {
  await request<{ chat: ChatMeta }>(`/api/chats/${chat.id}`, {
    method: 'PUT',
    body: JSON.stringify(chat),
  })
}

export async function deleteChat(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/chats/${id}`, { method: 'DELETE' })
}

export async function wipeData(): Promise<void> {
  await request<{ ok: boolean }>('/api/data', { method: 'DELETE' })
}
