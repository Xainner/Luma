import { z } from 'zod'
import type { FastifyReply } from 'fastify'

export const thoughtEffortSchema = z.enum(['off', 'low', 'medium', 'high'])

const imageSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(200),
  mime: z.string().max(100),
  dataUrl: z.string().max(40_000_000),
  size: z.number().nonnegative().optional(),
  width: z.number().int().positive().max(16000).optional(),
  height: z.number().int().positive().max(16000).optional(),
  uploadId: z.string().max(64).optional(),
})

const videoSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(200),
  mime: z.string().max(100),
  dataUrl: z.string().max(40_000_000).optional(),
  frames: z.array(z.string().max(5_000_000)).max(12).default([]),
  thumb: z.string().max(5_000_000).optional(),
  duration: z.number().nonnegative().optional(),
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  size: z.number().nonnegative().optional(),
  uploadId: z.string().max(64).optional(),
})

const chatMessageSchema = z.object({
  id: z.string().max(64),
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().max(10_000_000),
  images: z.array(imageSchema).max(6).optional(),
  videos: z.array(videoSchema).max(3).optional(),
  thinking: z.string().max(10_000_000).optional(),
  createdAt: z.number().default(() => Date.now()),
})

export const chatBodySchema = z.object({
  messages: z.array(chatMessageSchema).max(500),
  model: z.string().max(120).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(200_000).optional(),
})

export type ChatBodyInput = z.infer<typeof chatBodySchema>

export const configBodySchema = z
  .object({
    baseUrl: z.string().max(500).optional(),
    apiKey: z.string().max(2000).optional(),
    model: z.string().max(120).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().max(200_000).optional(),
    systemPrompt: z.string().max(100_000).optional(),
    profileId: z.string().max(64).optional(),
    language: z.enum(['es', 'en']).optional(),
    thinkingEffort: thoughtEffortSchema.optional(),
    modelThinking: z.record(z.string().max(120), thoughtEffortSchema).optional(),
    clearApiKey: z.boolean().optional(),
  })
  .strict()

export type ConfigBodyInput = z.infer<typeof configBodySchema>

/** Valida o responde 400 con el primer error legible. Devuelve null si falló. */
export function parseOr400<T>(schema: z.ZodType<T>, data: unknown, reply: FastifyReply): T | null {
  const parsed = schema.safeParse(data)
  if (parsed.success) return parsed.data
  const issue = parsed.error.issues[0]
  const where = issue.path.length ? ` (${issue.path.join('.')})` : ''
  reply.code(400).send({ error: `Cuerpo inválido${where}: ${issue.message}` })
  return null
}
