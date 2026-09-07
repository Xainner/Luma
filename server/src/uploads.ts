import type { FastifyInstance, FastifyRequest } from 'fastify'
import { randomUUID } from 'node:crypto'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { User } from './db.js'

/**
 * Uploads binarios fuera del JSON de chats.
 * - POST /api/uploads (binario crudo + headers x-luma-*) → { id, size }
 * - GET  /api/uploads/:id (auth por header o ?token=, con Range) → binario
 * Los archivos viven en UPLOAD_DIR (volumen ./data en compose).
 */

export function uploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? './data/uploads'
  mkdirSync(dir, { recursive: true })
  return dir
}

const MAX_BYTES = { video: 200 * 1024 * 1024, image: 25 * 1024 * 1024, other: 25 * 1024 * 1024 }

function kindOf(mime: string): keyof typeof MAX_BYTES {
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  return 'other'
}

function sanitizeId(id: string): string {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error('id inválido')
  return id
}

interface Meta {
  id: string
  name: string
  mime: string
  size: number
  userId: string
  createdAt: number
}

function metaPath(id: string): string {
  return path.join(uploadDir(), `${id}.meta.json`)
}

function dataPath(id: string, mime: string): string {
  const ext = (mime.split('/')[1] ?? 'bin').split(/[+;]/)[0].slice(0, 12) || 'bin'
  return path.join(uploadDir(), `${id}.${ext}`)
}

function findData(id: string): string | null {
  const dir = uploadDir()
  const prefix = `${id}.`
  try {
    for (const f of readdirSync(dir)) {
      if (f.startsWith(prefix) && !f.endsWith('.meta.json')) return path.join(dir, f)
    }
  } catch {
    /* ignore */
  }
  return null
}

export async function registerUploads(
  app: FastifyInstance,
  opts: { getUser: (req: FastifyRequest) => Promise<User | null> },
): Promise<void> {
  // Fastify responde 415 sin parser registrado: acepta binarios crudos sin
  // bufferizar (el handler lee req.raw por streaming con su propio límite).
  app.addContentTypeParser(
    /^video\/.*|^image\/.*|^application\/octet-stream$|^application\/x-www-form-urlencoded$/,
    function (_req, _payload, done) {
      done(null, undefined)
    },
  )
  app.post('/api/uploads', async (req, reply) => {
    const user = (req as FastifyRequest & { user?: User }).user ?? (await opts.getUser(req))
    if (!user) return reply.code(401).send({ error: 'No autenticado.' })
    const mime = String(req.headers['x-luma-mime'] ?? 'application/octet-stream').slice(0, 100)
    const name = String(req.headers['x-luma-filename'] ?? 'archivo').slice(0, 200)
    const kind = kindOf(mime)
    if (kind === 'other') return reply.code(400).send({ error: 'Solo se permiten imágenes y videos.' })
    const limit = MAX_BYTES[kind]
    const announced = Number(req.headers['content-length'] ?? 0)
    if (announced > limit) {
      return reply.code(413).send({ error: `Archivo excede ${(limit / 1048576).toFixed(0)} MB.` })
    }
    const id = randomUUID()
    const dest = dataPath(id, mime)
    let bytes = 0
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = createWriteStream(dest)
        req.raw.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > limit) {
            req.raw.destroy()
            ws.destroy()
            reject(new Error('LIMIT'))
          }
        })
        req.raw.pipe(ws)
        ws.on('finish', () => resolve())
        ws.on('error', reject)
        req.raw.on('error', reject)
      })
    } catch (err) {
      try {
        unlinkSync(dest)
      } catch {
        /* ignore */
      }
      if (err instanceof Error && err.message === 'LIMIT') {
        return reply.code(413).send({ error: `Archivo excede ${(limit / 1048576).toFixed(0)} MB.` })
      }
      throw err
    }
    const meta: Meta = { id, name, mime, size: bytes, userId: user.id, createdAt: Date.now() }
    writeFileSync(metaPath(id), JSON.stringify(meta))
    return reply.send({ id, name, mime, size: bytes })
  })

  app.get('/api/uploads/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const user = (req as FastifyRequest & { user?: User }).user ?? (await opts.getUser(req))
    if (!user) return reply.code(401).send({ error: 'No autenticado.' })
    let id: string
    try {
      id = sanitizeId(req.params.id)
    } catch {
      return reply.code(400).send({ error: 'id inválido' })
    }
    if (!existsSync(metaPath(id))) return reply.code(404).send({ error: 'No encontrado.' })
    const meta = JSON.parse(readFileSync(metaPath(id), 'utf8')) as Meta
    const file = findData(id)
    if (!file) return reply.code(404).send({ error: 'No encontrado.' })
    const size = statSync(file).size
    const range = req.headers.range
    reply.header('Content-Type', meta.mime)
    reply.header('Accept-Ranges', 'bytes')
    reply.header('Content-Disposition', `inline; filename="${meta.name.replace(/"/g, '')}"`)
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range)
      const start = m?.[1] ? Number(m[1]) : 0
      const end = m?.[2] ? Number(m[2]) : size - 1
      if (Number.isNaN(start) || Number.isNaN(end) || start >= size || end >= size) {
        return reply.code(416).send({ error: 'Rango inválido.' })
      }
      reply.code(206)
      reply.header('Content-Range', `bytes ${start}-${end}/${size}`)
      reply.header('Content-Length', end - start + 1)
      return reply.send(createReadStream(file, { start, end }))
    }
    reply.header('Content-Length', size)
    return reply.send(createReadStream(file))
  })
}
