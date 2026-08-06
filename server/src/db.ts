import pg from 'pg'
import type { AppConfig, Chat } from './index.js'

const connectionString = process.env.DATABASE_URL ?? 'postgres://luma:luma@localhost:5432/luma'

export const pool = new pg.Pool({ connectionString, max: 5 })

export interface Profile {
  id: string
  name: string
  masterPrompt: string
  emoji: string
  color: string
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      id             INTEGER PRIMARY KEY CHECK (id = 1),
      base_url       TEXT NOT NULL DEFAULT '',
      api_key        TEXT NOT NULL DEFAULT '',
      model          TEXT NOT NULL DEFAULT '',
      temperature    DOUBLE PRECISION NOT NULL DEFAULT 0.7,
      max_tokens     INTEGER NOT NULL DEFAULT 4096,
      system_prompt  TEXT NOT NULL DEFAULT '',
      profile_id     UUID
    );
    ALTER TABLE app_config ADD COLUMN IF NOT EXISTS profile_id UUID;
    CREATE TABLE IF NOT EXISTS profiles (
      id            UUID PRIMARY KEY,
      name          TEXT NOT NULL,
      master_prompt TEXT NOT NULL DEFAULT '',
      emoji         TEXT NOT NULL DEFAULT '✨',
      color         TEXT NOT NULL DEFAULT '#8b5cf6',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

const defaultConfig: AppConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
  profileId: '',
}

export async function loadConfig(): Promise<AppConfig> {
  const { rows } = await pool.query('SELECT * FROM app_config WHERE id = 1')
  if (rows.length === 0) return { ...defaultConfig }
  const r = rows[0] as {
    base_url: string
    api_key: string
    model: string
    temperature: number
    max_tokens: number
    system_prompt: string
    profile_id: string | null
  }
  return {
    baseUrl: r.base_url,
    apiKey: r.api_key,
    model: r.model,
    temperature: r.temperature,
    maxTokens: r.max_tokens,
    systemPrompt: r.system_prompt,
    profileId: r.profile_id ?? '',
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await pool.query(
    `INSERT INTO app_config (id, base_url, api_key, model, temperature, max_tokens, system_prompt, profile_id)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       base_url      = EXCLUDED.base_url,
       api_key       = EXCLUDED.api_key,
       model         = EXCLUDED.model,
       temperature   = EXCLUDED.temperature,
       max_tokens    = EXCLUDED.max_tokens,
       system_prompt = EXCLUDED.system_prompt,
       profile_id    = EXCLUDED.profile_id`,
    [
      config.baseUrl,
      config.apiKey,
      config.model,
      config.temperature,
      config.maxTokens,
      config.systemPrompt,
      config.profileId || null,
    ],
  )
}

/* ---------- Profiles ---------- */

function rowToProfile(r: Record<string, unknown>): Profile {
  return {
    id: r.id as string,
    name: r.name as string,
    masterPrompt: r.master_prompt as string,
    emoji: r.emoji as string,
    color: r.color as string,
  }
}

export async function listProfiles(): Promise<Profile[]> {
  const { rows } = await pool.query('SELECT id, name, master_prompt, emoji, color FROM profiles ORDER BY created_at ASC')
  return rows.map(rowToProfile)
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { rows } = await pool.query(
    'SELECT id, name, master_prompt, emoji, color FROM profiles WHERE id = $1',
    [id],
  )
  return rows.length ? rowToProfile(rows[0]) : null
}

export async function saveProfile(profile: Profile): Promise<void> {
  await pool.query(
    `INSERT INTO profiles (id, name, master_prompt, emoji, color, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (id) DO UPDATE SET
       name          = EXCLUDED.name,
       master_prompt = EXCLUDED.master_prompt,
       emoji         = EXCLUDED.emoji,
       color         = EXCLUDED.color,
       updated_at    = now()`,
    [profile.id, profile.name, profile.masterPrompt, profile.emoji, profile.color],
  )
}

export async function deleteProfile(id: string): Promise<void> {
  await pool.query('DELETE FROM profiles WHERE id = $1', [id])
}

/* ---------- Chats ---------- */

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
