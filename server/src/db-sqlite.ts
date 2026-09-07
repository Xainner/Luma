import Database from 'better-sqlite3'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import {
  defaultConfig,
  escapeLike,
  hashPassword,
  makeLoadEffectiveConfig,
  rowToConfig,
  rowToProfile,
  type AppConfig,
  type Chat,
  type ChatMeta,
  type ConfigScope,
  type Profile,
  type User,
} from './db-shared.js'

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    const dbPath = process.env.DATABASE_PATH ?? './data/luma.db'
    mkdirSync(path.dirname(dbPath), { recursive: true })
    _db = new Database(dbPath)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
  }
  return _db
}

function ensureColumn(table: string, column: string, ddl: string): void {
  const cols = getDb().prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === column)) {
    getDb().exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
  }
}

export async function initDb(): Promise<void> {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      base_url      TEXT NOT NULL DEFAULT '',
      api_key       TEXT NOT NULL DEFAULT '',
      model         TEXT NOT NULL DEFAULT '',
      temperature   REAL NOT NULL DEFAULT 0.7,
      max_tokens    INTEGER NOT NULL DEFAULT 4096,
      system_prompt TEXT NOT NULL DEFAULT '',
      profile_id    TEXT,
      config_scope  TEXT NOT NULL DEFAULT 'global',
      language      TEXT NOT NULL DEFAULT 'es',
      thinking_effort TEXT NOT NULL DEFAULT 'medium',
      model_thinking TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      master_prompt TEXT NOT NULL DEFAULT '',
      emoji         TEXT NOT NULL DEFAULT '✨',
      color         TEXT NOT NULL DEFAULT '#8b5cf6',
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('admin','user')),
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS user_config (
      user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      base_url    TEXT NOT NULL DEFAULT '',
      api_key     TEXT NOT NULL DEFAULT '',
      model       TEXT NOT NULL DEFAULT '',
      temperature REAL NOT NULL DEFAULT 0.7,
      max_tokens  INTEGER NOT NULL DEFAULT 4096,
      profile_id  TEXT,
      language    TEXT NOT NULL DEFAULT 'es',
      thinking_effort TEXT NOT NULL DEFAULT 'medium',
      model_thinking TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS chats (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL DEFAULT '',
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      messages   TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_chats_user ON chats (user_id, updated_at DESC);
  `)

  // Migraciones ligeras para DBs existentes
  ensureColumn('app_config', 'thinking_effort', `TEXT NOT NULL DEFAULT 'medium'`)
  ensureColumn('app_config', 'model_thinking', `TEXT NOT NULL DEFAULT '{}'`)
  ensureColumn('user_config', 'thinking_effort', `TEXT NOT NULL DEFAULT 'medium'`)
  ensureColumn('user_config', 'model_thinking', `TEXT NOT NULL DEFAULT '{}'`)

  // Seed admin por defecto
  const existing = await findUserByEmail('admin@luma.local')
  if (!existing) {
    await createUser('admin@luma.local', 'password', 'admin')
  }
  // Chats huérfanos (pre-login) → admin
  const admin = await findUserByEmail('admin@luma.local')
  if (admin) {
    db.prepare('UPDATE chats SET user_id = ? WHERE user_id IS NULL').run(admin.id)
  }
}

/* ---------- Config ---------- */

export async function getConfigScope(): Promise<ConfigScope> {
  const row = getDb().prepare('SELECT config_scope FROM app_config WHERE id = 1').get() as
    { config_scope?: string } | undefined
  return row?.config_scope === 'user' ? 'user' : 'global'
}

export async function setConfigScope(scope: ConfigScope): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO app_config (id, config_scope) VALUES (1, ?)
       ON CONFLICT (id) DO UPDATE SET config_scope = excluded.config_scope`,
    )
    .run(scope)
}

export async function loadGlobalConfig(): Promise<AppConfig> {
  const row = getDb().prepare('SELECT * FROM app_config WHERE id = 1').get() as
    Record<string, unknown> | undefined
  return row ? { ...defaultConfig, ...rowToConfig(row) } : { ...defaultConfig }
}

export async function saveGlobalConfig(config: AppConfig): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO app_config (id, base_url, api_key, model, temperature, max_tokens, system_prompt, profile_id, language, thinking_effort, model_thinking)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         base_url      = excluded.base_url,
         api_key       = excluded.api_key,
         model         = excluded.model,
         temperature   = excluded.temperature,
         max_tokens    = excluded.max_tokens,
         system_prompt = excluded.system_prompt,
         profile_id    = excluded.profile_id,
         language      = excluded.language,
         thinking_effort = excluded.thinking_effort,
         model_thinking  = excluded.model_thinking`,
    )
    .run(
      config.baseUrl,
      config.apiKey,
      config.model,
      config.temperature,
      config.maxTokens,
      config.systemPrompt,
      config.profileId || null,
      config.language === 'en' ? 'en' : 'es',
      config.thinkingEffort ?? 'medium',
      JSON.stringify(config.modelThinking ?? {}),
    )
}

export async function saveGlobalSystemPrompt(systemPrompt: string): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO app_config (id, system_prompt) VALUES (1, ?)
       ON CONFLICT (id) DO UPDATE SET system_prompt = excluded.system_prompt`,
    )
    .run(systemPrompt)
}

export async function loadUserConfig(userId: string): Promise<AppConfig> {
  const row = getDb()
    .prepare(
      'SELECT base_url, api_key, model, temperature, max_tokens, profile_id, language, thinking_effort, model_thinking FROM user_config WHERE user_id = ?',
    )
    .get(userId) as Record<string, unknown> | undefined
  return row ? { ...defaultConfig, ...rowToConfig(row) } : { ...defaultConfig }
}

export async function saveUserConfig(userId: string, config: Partial<AppConfig>): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO user_config (user_id, base_url, api_key, model, temperature, max_tokens, profile_id, language, thinking_effort, model_thinking)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         base_url    = excluded.base_url,
         api_key     = excluded.api_key,
         model       = excluded.model,
         temperature = excluded.temperature,
         max_tokens  = excluded.max_tokens,
         profile_id  = excluded.profile_id,
         language    = excluded.language,
         thinking_effort = excluded.thinking_effort,
         model_thinking  = excluded.model_thinking`,
    )
    .run(
      userId,
      config.baseUrl ?? '',
      config.apiKey ?? '',
      config.model ?? '',
      config.temperature ?? 0.7,
      config.maxTokens ?? 4096,
      config.profileId || null,
      config.language === 'en' ? 'en' : 'es',
      config.thinkingEffort ?? 'medium',
      JSON.stringify(config.modelThinking ?? {}),
    )
}

export const loadEffectiveConfig = makeLoadEffectiveConfig({
  loadGlobalConfig,
  getConfigScope,
  loadUserConfig,
})

/* ---------- Users / auth ---------- */

export async function createUser(
  email: string,
  password: string,
  role: User['role'],
): Promise<User> {
  const id = randomBytes(16).toString('hex')
  getDb()
    .prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(id, email, hashPassword(password), role)
  return { id, email, role }
}

export async function findUserByEmail(
  email: string,
): Promise<(User & { passwordHash: string }) | null> {
  const row = getDb()
    .prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?')
    .get(email) as
    { id: string; email: string; role: User['role']; password_hash: string } | undefined
  if (!row) return null
  return { id: row.id, email: row.email, role: row.role, passwordHash: row.password_hash }
}

export async function getUserById(id: string): Promise<User | null> {
  const row = getDb().prepare('SELECT id, email, role FROM users WHERE id = ?').get(id) as
    { id: string; email: string; role: User['role'] } | undefined
  return row ? { id: row.id, email: row.email, role: row.role } : null
}

export async function listUsers(): Promise<Array<User & { createdAt: number }>> {
  const rows = getDb()
    .prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at ASC')
    .all() as Array<{ id: string; email: string; role: User['role']; created_at: string }>
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    createdAt: new Date(r.created_at).getTime(),
  }))
}

export async function updateUserRole(id: string, role: User['role']): Promise<void> {
  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
}

export async function updateUserPassword(id: string, password: string): Promise<void> {
  getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id)
}

export async function deleteUser(id: string): Promise<void> {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  getDb().prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  return token
}

export async function getUserByToken(token: string): Promise<User | null> {
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.role FROM sessions s
       JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as { id: string; email: string; role: User['role'] } | undefined
  return row ? { id: row.id, email: row.email, role: row.role } : null
}

export async function deleteSession(token: string): Promise<void> {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

/* ---------- Profiles ---------- */

export async function listProfiles(): Promise<Profile[]> {
  const rows = getDb()
    .prepare('SELECT id, name, master_prompt, emoji, color FROM profiles ORDER BY created_at ASC')
    .all() as Record<string, unknown>[]
  return rows.map(rowToProfile)
}

export async function getProfile(id: string): Promise<Profile | null> {
  const row = getDb()
    .prepare('SELECT id, name, master_prompt, emoji, color FROM profiles WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined
  return row ? rowToProfile(row) : null
}

export async function saveProfile(profile: Profile): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO profiles (id, name, master_prompt, emoji, color, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         name          = excluded.name,
         master_prompt = excluded.master_prompt,
         emoji         = excluded.emoji,
         color         = excluded.color,
         updated_at    = excluded.updated_at`,
    )
    .run(
      profile.id,
      profile.name,
      profile.masterPrompt,
      profile.emoji,
      profile.color,
      new Date().toISOString(),
    )
}

export async function deleteProfile(id: string): Promise<void> {
  getDb().prepare('DELETE FROM profiles WHERE id = ?').run(id)
}

/* ---------- Chats ---------- */

export async function listChats(userId: string, q?: string): Promise<ChatMeta[]> {
  let sql = 'SELECT id, title, updated_at FROM chats WHERE user_id = ?'
  const params: unknown[] = [userId]
  if (q && q.trim()) {
    sql +=
      " AND (LOWER(title) LIKE LOWER(?) ESCAPE '\\' OR LOWER(messages) LIKE LOWER(?) ESCAPE '\\')"
    const like = `%${escapeLike(q.trim())}%`
    params.push(like, like)
  }
  sql += ' ORDER BY updated_at DESC'
  const rows = getDb()
    .prepare(sql)
    .all(...params) as Array<{ id: string; title: string; updated_at: string }>
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: new Date(r.updated_at).getTime(),
  }))
}

export async function getChat(id: string, userId: string): Promise<Chat | null> {
  const row = getDb()
    .prepare(
      'SELECT id, title, created_at, updated_at, messages FROM chats WHERE id = ? AND user_id = ?',
    )
    .get(id, userId) as
    | { id: string; title: string; created_at: string; updated_at: string; messages: string }
    | undefined
  if (!row) return null
  let messages: Chat['messages']
  try {
    messages = JSON.parse(row.messages) as Chat['messages']
  } catch {
    messages = []
  }
  return {
    id: row.id,
    title: row.title,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    messages,
  }
}

export async function saveChat(chat: Chat, userId: string): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO chats (id, title, user_id, created_at, updated_at, messages)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         title      = excluded.title,
         user_id    = excluded.user_id,
         updated_at = excluded.updated_at,
         messages   = excluded.messages`,
    )
    .run(
      chat.id,
      chat.title,
      userId,
      new Date(chat.createdAt).toISOString(),
      new Date(chat.updatedAt).toISOString(),
      JSON.stringify(chat.messages),
    )
}

export async function deleteChat(id: string, userId: string): Promise<void> {
  getDb().prepare('DELETE FROM chats WHERE id = ? AND user_id = ?').run(id, userId)
}

export async function deleteUserChats(userId: string): Promise<void> {
  getDb().prepare('DELETE FROM chats WHERE user_id = ?').run(userId)
}
