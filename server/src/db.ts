import pg from 'pg'
import type { AppConfig, Chat } from './index.js'

const connectionString = process.env.DATABASE_URL ?? 'postgres://luma:luma@localhost:5432/luma'

export const pool = new pg.Pool({ connectionString, max: 5 })

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      id             INTEGER PRIMARY KEY CHECK (id = 1),
      base_url       TEXT NOT NULL DEFAULT '',
      api_key        TEXT NOT NULL DEFAULT '',
      model          TEXT NOT NULL DEFAULT '',
      temperature    DOUBLE PRECISION NOT NULL DEFAULT 0.7,
      max_tokens     INTEGER NOT NULL DEFAULT 4096,
      system_prompt  TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS chats (
      id         UUID PRIMARY KEY,
      title      TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      messages   JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `)
}

export async function loadConfig(): Promise<AppConfig> {
  const { rows } = await pool.query('SELECT * FROM app_config WHERE id = 1')
  if (rows.length === 0) {
    return {
      baseUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
    }
  }
  const r = rows[0] as {
    base_url: string
    api_key: string
    model: string
    temperature: number
    max_tokens: number
    system_prompt: string
  }
  return {
    baseUrl: r.base_url,
    apiKey: r.api_key,
    model: r.model,
    temperature: r.temperature,
    maxTokens: r.max_tokens,
    systemPrompt: r.system_prompt,
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await pool.query(
    `INSERT INTO app_config (id, base_url, api_key, model, temperature, max_tokens, system_prompt)
     VALUES (1, $1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       base_url      = EXCLUDED.base_url,
       api_key       = EXCLUDED.api_key,
       model         = EXCLUDED.model,
       temperature   = EXCLUDED.temperature,
       max_tokens    = EXCLUDED.max_tokens,
       system_prompt = EXCLUDED.system_prompt`,
    [
      config.baseUrl,
      config.apiKey,
      config.model,
      config.temperature,
      config.maxTokens,
      config.systemPrompt,
    ],
  )
}

export interface ChatMeta {
  id: string
  title: string
  updatedAt: number
}

export async function listChats(): Promise<ChatMeta[]> {
  const { rows } = await pool.query(
    'SELECT id, title, updated_at FROM chats ORDER BY updated_at DESC',
  )
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    updatedAt: new Date(r.updated_at as string).getTime(),
  }))
}

export async function getChat(id: string): Promise<Chat | null> {
  const { rows } = await pool.query(
    'SELECT id, title, created_at, updated_at, messages FROM chats WHERE id = $1',
    [id],
  )
  if (rows.length === 0) return null
  const r = rows[0] as {
    id: string
    title: string
    created_at: string
    updated_at: string
    messages: unknown
  }
  return {
    id: r.id,
    title: r.title,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
    messages: r.messages as Chat['messages'],
  }
}

export async function saveChat(chat: Chat): Promise<void> {
  await pool.query(
    `INSERT INTO chats (id, title, created_at, updated_at, messages)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       title      = EXCLUDED.title,
       updated_at = EXCLUDED.updated_at,
       messages   = EXCLUDED.messages`,
    [chat.id, chat.title, new Date(chat.createdAt), new Date(chat.updatedAt), JSON.stringify(chat.messages)],
  )
}

export async function deleteChat(id: string): Promise<void> {
  await pool.query('DELETE FROM chats WHERE id = $1', [id])
}

export async function deleteAllChats(): Promise<void> {
  await pool.query('DELETE FROM chats')
}
