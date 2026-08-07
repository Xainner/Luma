import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyStatic from '@fastify/static'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  checkPassword,
  createSession,
  createUser,
  deleteChat,
  deleteProfile,
  deleteSession,
  deleteUser,
  deleteUserChats,
  findUserByEmail,
  getChat,
  getConfigScope,
  getProfile,
  getUserByToken,
  initDb,
  listChats,
  listProfiles,
  listUsers,
  loadEffectiveConfig,
  loadGlobalConfig,
  loadUserConfig,
  saveChat,
  saveGlobalConfig,
  saveGlobalSystemPrompt,
  saveProfile,
  saveUserConfig,
  setConfigScope,
  updateUserPassword,
  updateUserRole,
  type ConfigScope,
  type Profile,
  type User,
} from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_DIST = process.env.WEB_DIST
  ? path.resolve(process.env.WEB_DIST)
  : path.resolve(__dirname, '..', '..', 'web', 'dist')

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'

declare module 'fastify' {
  interface FastifyRequest {
    user?: User
  }
}

export interface AppConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  profileId: string
  language: 'es' | 'en'
}

export interface ImageAttachment {
  id: string
  name: string
  mime: string
  dataUrl: string
}

export interface ChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
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

const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 })

app.register(fastifyStatic, { root: WEB_DIST, prefix: '/', wildcard: false })

/* ---------- Auth middleware ---------- */

app.addHook('preHandler', async (req, reply) => {
  const url = req.url
  if (!url.startsWith('/api/') || url === '/api/auth/login') return
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  const user = token ? await getUserByToken(token) : null
  if (!user) return reply.code(401).send({ error: 'No autenticado.' })
  req.user = user
})

function userOf(req: FastifyRequest): User {
  if (!req.user) throw new Error('Sin usuario')
  return req.user
}

function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (req.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Requiere rol de administrador.' })
  }
}

function publicConfig(config: AppConfig): AppConfig {
  return { ...config, apiKey: '' }
}

function sanitizeId(id: string): string {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error('id inválido')
  return id
}

function baseUrlOf(config: AppConfig): string {
  return config.baseUrl.trim().replace(/\/+$/, '')
}

function authHeaders(apiKey: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey.trim()}` } : {}
}

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308])

async function fetchFollow(url: string, init: RequestInit, redirects = 0): Promise<Response> {
  const res = await fetch(url, { ...init, redirect: 'manual' })
  if (redirects < 5 && REDIRECT_STATUS.has(res.status)) {
    const location = res.headers.get('location')
    if (location) {
      await res.body?.cancel().catch(() => {})
      return fetchFollow(new URL(location, url).toString(), init, redirects + 1)
    }
  }
  return res
}

function toApiMessages(messages: ChatMessage[], systemPrompt: string) {
  const out: Array<Record<string, unknown>> = []
  if (systemPrompt.trim()) {
    out.push({ role: 'system', content: systemPrompt.trim() })
  }
  for (const m of messages) {
    if (m.role === 'system') continue
    if (m.role === 'user' && m.images?.length) {
      out.push({
        role: 'user',
        content: [
          { type: 'text', text: m.content },
          ...m.images.map((img) => ({ type: 'image_url', image_url: { url: img.dataUrl } })),
        ],
      })
    } else {
      out.push({ role: m.role, content: m.content })
    }
  }
  return out
}

type ConfigBody = Partial<AppConfig> & { clearApiKey?: boolean }

function resolveApiKey(body: ConfigBody, currentKey: string): string {
  if (body.clearApiKey) return ''
  if (typeof body.apiKey === 'string' && body.apiKey.length > 0) return body.apiKey.trim()
  return currentKey
}

function configResponse(effective: AppConfig, scope: ConfigScope, isAdmin: boolean) {
  return {
    config: publicConfig(effective),
    apiKeySet: !!effective.apiKey,
    scope,
    isAdmin,
  }
}

/* ---------- Auth ---------- */

app.post('/api/auth/login', async (req, reply) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string }
  if (!email || !password) return reply.code(400).send({ error: 'Email y contraseña requeridos.' })
  const user = await findUserByEmail(email.trim())
  if (!user || !checkPassword(user, password)) {
    return reply.code(401).send({ error: 'Credenciales inválidas.' })
  }
  const token = await createSession(user.id)
  return reply.send({ token, user: { id: user.id, email: user.email, role: user.role } })
})

app.post('/api/auth/logout', async (req, reply) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (token) await deleteSession(token)
  return reply.send({ ok: true })
})

app.get('/api/auth/me', async (req, reply) => {
  return reply.send({ user: req.user ?? null })
})

/* ---------- Config ---------- */

app.get('/api/config', async (req, reply) => {
  const user = userOf(req)
  const [effective, scope] = await Promise.all([loadEffectiveConfig(user), getConfigScope()])
  return reply.send(configResponse(effective, scope, user.role === 'admin'))
})

app.post('/api/config', async (req, reply) => {
  const user = userOf(req)
  const body = (req.body ?? {}) as ConfigBody
  const scope = await getConfigScope()

  if (scope === 'user') {
    const current = await loadUserConfig(user.id)
    const next: Partial<AppConfig> = {
      ...body,
      apiKey: resolveApiKey(body, current.apiKey),
    }
    await saveUserConfig(user.id, next)
    const effective = await loadEffectiveConfig(user)
    return reply.send(configResponse(effective, scope, user.role === 'admin'))
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      error: 'La configuración es global y solo el administrador puede modificarla.',
    })
  }
  const current = await loadGlobalConfig()
  const next: AppConfig = { ...current, ...body, apiKey: resolveApiKey(body, current.apiKey) }
  await saveGlobalConfig(next)
  const effective = await loadEffectiveConfig(user)
  return reply.send(configResponse(effective, scope, true))
})

/* ---------- Admin: scope, system prompt, users ---------- */

app.put(
  '/api/admin/scope',
  async (req, reply) => {
    const denied = requireAdmin(req, reply)
    if (denied) return denied
    const { scope } = (req.body ?? {}) as { scope?: ConfigScope }
    if (scope !== 'global' && scope !== 'user') {
      return reply.code(400).send({ error: 'scope inválido.' })
    }
    await setConfigScope(scope)
    return reply.send({ scope })
  },
)

app.put('/api/admin/system-prompt', async (req, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const { systemPrompt } = (req.body ?? {}) as { systemPrompt?: string }
  await saveGlobalSystemPrompt(systemPrompt ?? '')
  return reply.send({ ok: true, systemPrompt: systemPrompt ?? '' })
})

app.get('/api/admin/users', async (req, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  return reply.send({ users: await listUsers() })
})

app.post('/api/admin/users', async (req, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const { email, password, role } = (req.body ?? {}) as {
    email?: string
    password?: string
    role?: User['role']
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return reply.code(400).send({ error: 'Email inválido.' })
  }
  if (!password || password.length < 4) {
    return reply.code(400).send({ error: 'La contraseña debe tener al menos 4 caracteres.' })
  }
  const user = await createUser(email.trim(), password, role === 'admin' ? 'admin' : 'user')
  return reply.send({ user: { id: user.id, email: user.email, role: user.role } })
})

app.put('/api/admin/users/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const id = sanitizeId(req.params.id)
  const { role, password } = (req.body ?? {}) as { role?: User['role']; password?: string }
  const me = userOf(req)

  if (role && role !== 'admin' && role !== 'user') {
    return reply.code(400).send({ error: 'Rol inválido.' })
  }
  if (id === me.id && role === 'user') {
    return reply.code(400).send({ error: 'No puedes quitarte el rol de administrador.' })
  }
  if (role === 'user') {
    const admins = (await listUsers()).filter((u) => u.role === 'admin')
    if (admins.length === 1 && admins[0].id === id) {
      return reply.code(400).send({ error: 'Debe existir al menos un administrador.' })
    }
  }
  if (role) await updateUserRole(id, role)
  if (typeof password === 'string' && password) await updateUserPassword(id, password)
  return reply.send({ ok: true })
})

app.delete('/api/admin/users/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const id = sanitizeId(req.params.id)
  const me = userOf(req)
  if (id === me.id) return reply.code(400).send({ error: 'No puedes eliminar tu propia cuenta.' })
  const admins = (await listUsers()).filter((u) => u.role === 'admin')
  if (admins.length === 1 && admins[0].id === id) {
    return reply.code(400).send({ error: 'Debe existir al menos un administrador.' })
  }
  await deleteUser(id)
  return reply.send({ ok: true })
})

/* ---------- Model discovery ---------- */

app.get('/api/models', async (req, reply) => {
  const user = userOf(req)
  const effective = await loadEffectiveConfig(user)
  const hdrBase = req.headers['x-luma-base']
  const hdrKey = req.headers['x-luma-key']
  const baseUrl =
    typeof hdrBase === 'string' && hdrBase.trim()
      ? baseUrlOf({ baseUrl: hdrBase } as AppConfig)
      : baseUrlOf(effective)
  const apiKey = typeof hdrKey === 'string' ? hdrKey : effective.apiKey
  if (!baseUrl) return reply.code(400).send({ error: 'No hay una URL base configurada.' })
  try {
    const res = await fetchFollow(`${baseUrl}/models`, {
      headers: { ...authHeaders(apiKey), Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      const text = (await res.text().catch(() => '')).slice(0, 400)
      return reply.code(502).send({ error: `El servidor respondió ${res.status}: ${text}` })
    }
    const data = (await res.json()) as { data?: Array<{ id: string }> }
    const models = (data?.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
    return reply.send({ models })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return reply.code(502).send({ error: `No se pudo conectar: ${message}` })
  }
})

/* ---------- Chat completions (SSE streaming proxy) ---------- */

interface ChatBody {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

function composeSystemPrompt(config: AppConfig, profile: Profile | null): string {
  return [config.systemPrompt, profile?.masterPrompt ?? '']
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n\n')
}

app.post('/api/chat', async (req: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
  const user = userOf(req)
  const effective = await loadEffectiveConfig(user)
  const baseUrl = baseUrlOf(effective)
  if (!baseUrl) return reply.code(400).send({ error: 'No hay una URL base configurada.' })

  const { messages, model, temperature, maxTokens } = req.body ?? {}
  const profile = effective.profileId ? await getProfile(effective.profileId) : null
  const systemPrompt = composeSystemPrompt(effective, profile)

  const payload = {
    model: model || effective.model,
    messages: toApiMessages(messages ?? [], systemPrompt),
    temperature: temperature ?? effective.temperature,
    max_tokens: maxTokens ?? effective.maxTokens,
    stream: true,
  }

    const upstreamController = new AbortController()
    let upstream: Response
    try {
      upstream = await fetchFollow(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(effective.apiKey),
        },
        body: JSON.stringify(payload),
        signal: upstreamController.signal,
      })
    } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return reply.code(502).send({ error: `No se pudo conectar: ${message}` })
  }

  if (!upstream.ok) {
    const text = (await upstream.text().catch(() => '')).slice(0, 500)
    return reply.code(502).send({ error: `El servidor respondió ${upstream.status}: ${text}` })
  }

  if (!upstream.body) {
    return reply.code(502).send({ error: 'El servidor no devolvió un body de streaming.' })
  }

  reply.hijack()
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  reply.raw.on('close', () => upstreamController.abort())

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      reply.raw.write(decoder.decode(value, { stream: true }))
    }
    reply.raw.end()
  } catch {
    try {
      reply.raw.write(`data: ${JSON.stringify({ error: 'Conexión interrumpida con el LLM.' })}\n\n`)
    } catch {
      /* socket may be gone */
    }
    reply.raw.end()
  }
})

/* ---------- Profiles (escritura solo admin) ---------- */

app.get('/api/profiles', async (_req, reply) => {
  return reply.send({ profiles: await listProfiles() })
})

app.post('/api/profiles', async (req, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const body = (req.body ?? {}) as Partial<Profile>
  const profile: Profile = {
    id: randomUUID(),
    name: body.name ?? 'Nuevo perfil',
    masterPrompt: body.masterPrompt ?? '',
    emoji: body.emoji ?? '✨',
    color: body.color ?? '#8b5cf6',
  }
  await saveProfile(profile)
  return reply.send({ profile })
})

app.put('/api/profiles/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: Partial<Profile> }>, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const id = sanitizeId(req.params.id)
  const existing = await getProfile(id)
  if (!existing) return reply.code(404).send({ error: 'Perfil no encontrado.' })
  const profile: Profile = { ...existing, ...(req.body ?? {}) }
  await saveProfile(profile)
  return reply.send({ profile })
})

app.delete('/api/profiles/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const denied = requireAdmin(req, reply)
  if (denied) return denied
  const id = sanitizeId(req.params.id)
  await deleteProfile(id)
  return reply.send({ ok: true })
})

/* ---------- Chats (por usuario) ---------- */

app.get('/api/chats', async (req, reply) => {
  const q = (req.query as { q?: string } | undefined)?.q
  return reply.send({ chats: await listChats(userOf(req).id, typeof q === 'string' ? q : undefined) })
})

app.post('/api/chats', async (req, reply) => {
  const chat: Chat = {
    id: randomUUID(),
    title: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  }
  await saveChat(chat, userOf(req).id)
  return reply.send({ chat })
})

app.get('/api/chats/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const id = sanitizeId(req.params.id)
  const chat = await getChat(id, userOf(req).id)
  if (!chat) return reply.code(404).send({ error: 'Chat no encontrado.' })
  return reply.send({ chat })
})

app.put('/api/chats/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: Chat }>, reply) => {
  const id = sanitizeId(req.params.id)
  const existing = await getChat(id, userOf(req).id)
  if (!existing) return reply.code(404).send({ error: 'Chat no encontrado.' })
  const chat = { ...existing, ...(req.body ?? {}), id, updatedAt: Date.now() }
  await saveChat(chat, userOf(req).id)
  return reply.send({ chat: { id, title: chat.title, updatedAt: chat.updatedAt } })
})

app.delete('/api/chats/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const id = sanitizeId(req.params.id)
  await deleteChat(id, userOf(req).id)
  return reply.send({ ok: true })
})

app.delete('/api/data', async (req, reply) => {
  await deleteUserChats(userOf(req).id)
  return reply.send({ ok: true })
})

/* ---------- Static fallback for SPA ---------- */

app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' })
  if (req.method !== 'GET') return reply.code(404).send({ error: 'Not found' })
  if (existsSync(path.join(WEB_DIST, 'index.html'))) {
    return reply.sendFile('index.html')
  }
  return reply.code(404).send({ error: 'Frontend no compilado. Ejecuta `npm run build -w web`.' })
})

try {
  await initDb()
  await app.listen({ port: PORT, host: HOST })
  console.log(`API escuchando en http://localhost:${PORT}`)
} catch (err) {
  console.error('No se pudo iniciar el servidor:', err)
  process.exit(1)
}
