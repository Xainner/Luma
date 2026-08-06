import pg from 'pg'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
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

export type ConfigScope = 'global' | 'user'

export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

interface UserRow extends User {
  password_hash: string
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
      profile_id     UUID,
      config_scope   TEXT NOT NULL DEFAULT 'global'
    );
    ALTER TABLE app_config ADD COLUMN IF NOT EXISTS profile_id UUID;
    ALTER TABLE app_config ADD COLUMN IF NOT EXISTS config_scope TEXT NOT NULL DEFAULT 'global';

    CREATE TABLE IF NOT EXISTS profiles (
      id            UUID PRIMARY KEY,
      name          TEXT NOT NULL,
      master_prompt TEXT NOT NULL DEFAULT '',
      emoji         TEXT NOT NULL DEFAULT '✨',
      color         TEXT NOT NULL DEFAULT '#8b5cf6',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('admin','user')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS user_config (
      user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      base_url    TEXT NOT NULL DEFAULT '',
      api_key     TEXT NOT NULL DEFAULT '',
      model       TEXT NOT NULL DEFAULT '',
      temperature DOUBLE PRECISION NOT NULL DEFAULT 0.7,
      max_tokens  INTEGER NOT NULL DEFAULT 4096,
      profile_id  UUID
    );

    CREATE TABLE IF NOT EXISTS chats (
      id         UUID PRIMARY KEY,
      title      TEXT NOT NULL DEFAULT '',
      user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      messages   JSONB NOT NULL DEFAULT '[]'::jsonb
    );
    ALTER TABLE chats ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_chats_user ON chats (user_id, updated_at DESC);
  `)

  // Seed admin por defecto
  const existing = await findUserByEmail('admin@luma.local')
  if (!existing) {
    await createUser('admin@luma.local', 'password', 'admin')
  }
  // Chats huérfanos (pre-login) → admin
  const admin = await findUserByEmail('admin@luma.local')
  if (admin) {
    await pool.query('UPDATE chats SET user_id = $1 WHERE user_id IS NULL', [admin.id])
  }
}

/* ---------- Config ---------- */

const defaultConfig: AppConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
  profileId: '',
}

function rowToConfig(r: Record<string, unknown>): AppConfig {
  return {
    baseUrl: (r.base_url as string) ?? '',
    apiKey: (r.api_key as string) ?? '',
    model: (r.model as string) ?? '',
    temperature: (r.temperature as number) ?? 0.7,
    maxTokens: (r.max_tokens as number) ?? 4096,
    systemPrompt: (r.system_prompt as string) ?? '',
    profileId: (r.profile_id as string) ?? '',
  }
}

export async function getConfigScope(): Promise<ConfigScope> {
  const { rows } = await pool.query('SELECT config_scope FROM app_config WHERE id = 1')
  return rows.length && rows[0].config_scope === 'user' ? 'user' : 'global'
}

export async function setConfigScope(scope: ConfigScope): Promise<void> {
  await pool.query(
    `INSERT INTO app_config (id, config_scope) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET config_scope = EXCLUDED.config_scope`,
    [scope],
  )
}

export async function loadGlobalConfig(): Promise<AppConfig> {
  const { rows } = await pool.query('SELECT * FROM app_config WHERE id = 1')
  return rows.length ? { ...defaultConfig, ...rowToConfig(rows[0]) } : { ...defaultConfig }
}

export async function saveGlobalConfig(config: AppConfig): Promise<void> {
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

export async function saveGlobalSystemPrompt(systemPrompt: string): Promise<void> {
  await pool.query(
    `INSERT INTO app_config (id, system_prompt) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt`,
    [systemPrompt],
  )
}

export async function loadUserConfig(userId: string): Promise<AppConfig> {
  const { rows } = await pool.query(
    'SELECT base_url, api_key, model, temperature, max_tokens, profile_id FROM user_config WHERE user_id = $1',
    [userId],
  )
  if (rows.length === 0) return { ...defaultConfig }
  return {
    baseUrl: rows[0].base_url ?? '',
    apiKey: rows[0].api_key ?? '',
    model: rows[0].model ?? '',
    temperature: rows[0].temperature ?? 0.7,
    maxTokens: rows[0].max_tokens ?? 4096,
    systemPrompt: '',
    profileId: rows[0].profile_id ?? '',
  }
}

export async function saveUserConfig(userId: string, config: Partial<AppConfig>): Promise<void> {
  await pool.query(
    `INSERT INTO user_config (user_id, base_url, api_key, model, temperature, max_tokens, profile_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       base_url    = EXCLUDED.base_url,
       api_key     = EXCLUDED.api_key,
       model       = EXCLUDED.model,
       temperature = EXCLUDED.temperature,
       max_tokens  = EXCLUDED.max_tokens,
       profile_id  = EXCLUDED.profile_id`,
    [
      userId,
      config.baseUrl ?? '',
      config.apiKey ?? '',
      config.model ?? '',
      config.temperature ?? 0.7,
      config.maxTokens ?? 4096,
      config.profileId || null,
    ],
  )
}

export async function loadEffectiveConfig(user: User): Promise<AppConfig> {
  const global = await loadGlobalConfig()
  const scope = await getConfigScope()
  if (scope === 'global') return { ...global }
  const userConfig = await loadUserConfig(user.id)
  return {
    baseUrl: userConfig.baseUrl || global.baseUrl,
    apiKey: userConfig.apiKey || global.apiKey,
    model: userConfig.model || global.model,
    temperature: userConfig.temperature ?? global.temperature,
    maxTokens: userConfig.maxTokens ?? global.maxTokens,
    systemPrompt: global.systemPrompt,
    profileId: userConfig.profileId || global.profileId,
  }
}

/* ---------- Users / auth ---------- */

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), test)
}

export async function createUser(email: string, password: string, role: User['role']): Promise<User> {
  const id = randomBytes(16).toString('hex')
  await pool.query(
    'INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
    [id, email, hashPassword(password), role],
  )
  return { id, email, role }
}

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const { rows } = await pool.query('SELECT id, email, role, password_hash FROM users WHERE email = $1', [
    email,
  ])
  if (rows.length === 0) return null
  return { id: rows[0].id, email: rows[0].email, role: rows[0].role, passwordHash: rows[0].password_hash }
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id])
  return rows.length ? { id: rows[0].id, email: rows[0].email, role: rows[0].role } : null
}

export async function listUsers(): Promise<Array<User & { createdAt: number }>> {
  const { rows } = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at ASC')
  return rows.map((r) => ({
    id: r.id as string,
    email: r.email as string,
    role: r.role as User['role'],
    createdAt: new Date(r.created_at as string).getTime(),
  }))
}

export async function updateUserRole(id: string, role: User['role']): Promise<void> {
  await pool.query('UPDATE users SET role = $2 WHERE id = $1', [id, role])
}

export async function updateUserPassword(id: string, password: string): Promise<void> {
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, hashPassword(password)])
}

export async function deleteUser(id: string): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [id])
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await pool.query('INSERT INTO sessions (token, user_id) VALUES ($1, $2)', [token, userId])
  return token
}

export async function getUserByToken(token: string): Promise<User | null> {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.role FROM sessions s
     JOIN users u ON u.id = s.user_id WHERE s.token = $1`,
    [token],
  )
  return rows.length ? { id: rows[0].id, email: rows[0].email, role: rows[0].role } : null
}

export async function deleteSession(token: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE token = $1', [token])
}

export function checkPassword(user: { passwordHash: string }, password: string): boolean {
  return verifyPassword(password, user.passwordHash)
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

export async function listChats(userId: string): Promise<ChatMeta[]> {
  const { rows } = await pool.query(
    'SELECT id, title, updated_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId],
  )
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    updatedAt: new Date(r.updated_at as string).getTime(),
  }))
}

export async function getChat(id: string, userId: string): Promise<Chat | null> {
  const { rows } = await pool.query(
    'SELECT id, title, created_at, updated_at, messages FROM chats WHERE id = $1 AND user_id = $2',
    [id, userId],
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

export async function saveChat(chat: Chat, userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO chats (id, title, user_id, created_at, updated_at, messages)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       title      = EXCLUDED.title,
       user_id    = EXCLUDED.user_id,
       updated_at = EXCLUDED.updated_at,
       messages   = EXCLUDED.messages`,
    [chat.id, chat.title, userId, new Date(chat.createdAt), new Date(chat.updatedAt), JSON.stringify(chat.messages)],
  )
}

export async function deleteChat(id: string, userId: string): Promise<void> {
  await pool.query('DELETE FROM chats WHERE id = $1 AND user_id = $2', [id, userId])
}

export async function deleteUserChats(userId: string): Promise<void> {
  await pool.query('DELETE FROM chats WHERE user_id = $1', [userId])
}
