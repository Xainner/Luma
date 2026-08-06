import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyStatic from '@fastify/static'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  deleteAllChats,
  deleteChat,
  getChat,
  initDb,
  listChats,
  loadConfig,
  saveChat,
  saveConfig,
} from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_DIST = process.env.WEB_DIST
  ? path.resolve(process.env.WEB_DIST)
  : path.resolve(__dirname, '..', '..', 'web', 'dist')

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'
const MASK = '********'

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

function publicConfig(config: AppConfig): AppConfig {
  return { ...config, apiKey: config.apiKey ? MASK : '' }
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

const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 })

app.register(fastifyStatic, { root: WEB_DIST, prefix: '/', wildcard: false })

/* ---------- Config ---------- */

app.get('/api/config', async () => {
  const config = await loadConfig()
  return { config: publicConfig(config) }
})

app.post(
  '/api/config',
  {
    schema: {
      body: {
        type: 'object',
        properties: {
          baseUrl: { type: 'string' },
          apiKey: { type: 'string' },
          model: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          maxTokens: { type: 'integer', minimum: 1 },
          systemPrompt: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
  async (req, reply) => {
    const body = (req.body ?? {}) as Partial<AppConfig>
    const current = await loadConfig()
    const next: AppConfig = { ...current, ...body }
    if (typeof body.apiKey === 'string') {
      next.apiKey = body.apiKey === MASK && current.apiKey ? current.apiKey : body.apiKey.trim()
    }
    await saveConfig(next)
    return reply.send({ config: publicConfig(next) })
  },
)

/* ---------- Model discovery ---------- */

app.get('/api/models', async (req, reply) => {
  const config = await loadConfig()
  const hdrBase = req.headers['x-luma-base']
  const hdrKey = req.headers['x-luma-key']
  const baseUrl =
    typeof hdrBase === 'string' && hdrBase.trim()
      ? baseUrlOf({ baseUrl: hdrBase } as AppConfig)
      : baseUrlOf(config)
  const apiKey = typeof hdrKey === 'string' ? hdrKey : config.apiKey
  if (!baseUrl) return reply.code(400).send({ error: 'No hay una URL base configurada.' })
  try {
    const res = await fetch(`${baseUrl}/models`, {
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
  systemPrompt?: string
}

app.post(
  '/api/chat',
  {
    schema: {
      body: {
        type: 'object',
        properties: {
          messages: { type: 'array' },
          model: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          maxTokens: { type: 'integer', minimum: 1 },
          systemPrompt: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
  async (req: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
    const config = await loadConfig()
    const baseUrl = baseUrlOf(config)
    if (!baseUrl) return reply.code(400).send({ error: 'No hay una URL base configurada.' })

    const { messages, model, temperature, maxTokens, systemPrompt } = req.body ?? {}

    const payload = {
      model: model || config.model,
      messages: toApiMessages(messages ?? [], systemPrompt ?? config.systemPrompt),
      temperature: temperature ?? config.temperature,
      max_tokens: maxTokens ?? config.maxTokens,
      stream: true,
    }

    const upstreamController = new AbortController()
    let upstream: Response
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(config.apiKey),
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
  },
)

/* ---------- Chats CRUD ---------- */

app.get('/api/chats', async () => {
  return { chats: await listChats() }
})

app.post('/api/chats', async (_req, reply) => {
  const chat: Chat = {
    id: randomUUID(),
    title: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  }
  await saveChat(chat)
  return reply.send({ chat })
})

app.get('/api/chats/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const id = sanitizeId(req.params.id)
  const chat = await getChat(id)
  if (!chat) return reply.code(404).send({ error: 'Chat no encontrado.' })
  return reply.send({ chat })
})

app.put('/api/chats/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: Chat }>, reply) => {
  const id = sanitizeId(req.params.id)
  const existing = await getChat(id)
  if (!existing) return reply.code(404).send({ error: 'Chat no encontrado.' })
  const chat = { ...existing, ...(req.body ?? {}), id, updatedAt: Date.now() }
  await saveChat(chat)
  return reply.send({ chat: { id, title: chat.title, updatedAt: chat.updatedAt } })
})

app.delete('/api/chats/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const id = sanitizeId(req.params.id)
  await deleteChat(id)
  return reply.send({ ok: true })
})

app.delete('/api/data', async (_req, reply) => {
  await deleteAllChats()
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
