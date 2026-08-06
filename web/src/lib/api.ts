import type { AdminUser, AppConfig, Chat, ChatMessage, ChatMeta, ConfigScope, Profile, User } from '../types'

const TOKEN_KEY = 'luma.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

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
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { ...init, headers })
  if (res.status === 401) setToken(null)
  if (!res.ok) throw new ApiError(await parseError(res), res.status)
  return res.json() as Promise<T>
}

/* ---------- Auth ---------- */

export async function login(email: string, password: string): Promise<User> {
  const data = await request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data.user
}

export async function logout(): Promise<void> {
  try {
    await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  } finally {
    setToken(null)
  }
}

export async function me(): Promise<User | null> {
  try {
    const data = await request<{ user: User | null }>('/api/auth/me')
    return data.user
  } catch {
    return null
  }
}

/* ---------- Config ---------- */

export interface ConfigResponse {
  config: AppConfig
  apiKeySet: boolean
  scope: ConfigScope
  isAdmin: boolean
}

export async function getConfig(): Promise<ConfigResponse> {
  return request<ConfigResponse>('/api/config')
}

export async function saveConfig(config: AppConfig): Promise<ConfigResponse> {
  return request<ConfigResponse>('/api/config', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function setConfigScope(scope: ConfigScope): Promise<void> {
  await request<{ scope: ConfigScope }>('/api/admin/scope', {
    method: 'PUT',
    body: JSON.stringify({ scope }),
  })
}

export async function saveSystemPrompt(systemPrompt: string): Promise<void> {
  await request<{ ok: boolean }>('/api/admin/system-prompt', {
    method: 'PUT',
    body: JSON.stringify({ systemPrompt }),
  })
}

/* ---------- Admin: users ---------- */

export async function listUsers(): Promise<AdminUser[]> {
  const data = await request<{ users: AdminUser[] }>('/api/admin/users')
  return data.users
}

export async function createUser(email: string, password: string, role: User['role']): Promise<User> {
  const data = await request<{ user: User }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  })
  return data.user
}

export async function updateUser(
  id: string,
  changes: { role?: User['role']; password?: string },
): Promise<void> {
  await request<{ ok: boolean }>(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteUser(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' })
}

/* ---------- Models ---------- */

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
  signal?: AbortSignal
}

export async function* streamChat(req: StreamRequest): AsyncGenerator<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
    signal: req.signal,
  })
  if (res.status === 401) setToken(null)
  if (!res.ok) throw new ApiError(await parseError(res), res.status)
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

/* ---------- Chats ---------- */

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

/* ---------- Profiles ---------- */

export async function listProfiles(): Promise<Profile[]> {
  const data = await request<{ profiles: Profile[] }>('/api/profiles')
  return data.profiles
}

export async function createProfile(profile: Partial<Profile>): Promise<Profile> {
  const data = await request<{ profile: Profile }>('/api/profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
  return data.profile
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const data = await request<{ profile: Profile }>(`/api/profiles/${profile.id}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
  return data.profile
}

export async function deleteProfile(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/profiles/${id}`, { method: 'DELETE' })
}
