export { checkPassword } from './db-shared.js'
export type {
  AppConfig,
  Chat,
  ChatMessage,
  ChatMeta,
  ConfigScope,
  ImageAttachment,
  Profile,
  ThoughtEffort,
  User,
  VideoAttachment,
} from './db-shared.js'

const DATABASE_TYPE = (process.env.DATABASE_TYPE ?? 'sqlite').trim().toLowerCase()

if (DATABASE_TYPE !== 'sqlite' && DATABASE_TYPE !== 'postgres') {
  throw new Error(
    `DATABASE_TYPE inválido: "${process.env.DATABASE_TYPE}" (usa "sqlite" o "postgres")`,
  )
}

const impl =
  DATABASE_TYPE === 'postgres' ? await import('./db-postgres.js') : await import('./db-sqlite.js')

export const initDb = impl.initDb
export const getConfigScope = impl.getConfigScope
export const setConfigScope = impl.setConfigScope
export const loadGlobalConfig = impl.loadGlobalConfig
export const saveGlobalConfig = impl.saveGlobalConfig
export const saveGlobalSystemPrompt = impl.saveGlobalSystemPrompt
export const loadUserConfig = impl.loadUserConfig
export const saveUserConfig = impl.saveUserConfig
export const loadEffectiveConfig = impl.loadEffectiveConfig
export const createUser = impl.createUser
export const findUserByEmail = impl.findUserByEmail
export const getUserById = impl.getUserById
export const listUsers = impl.listUsers
export const updateUserRole = impl.updateUserRole
export const updateUserPassword = impl.updateUserPassword
export const deleteUser = impl.deleteUser
export const createSession = impl.createSession
export const getUserByToken = impl.getUserByToken
export const deleteSession = impl.deleteSession
export const listProfiles = impl.listProfiles
export const getProfile = impl.getProfile
export const saveProfile = impl.saveProfile
export const deleteProfile = impl.deleteProfile
export const listChats = impl.listChats
export const getChat = impl.getChat
export const saveChat = impl.saveChat
export const deleteChat = impl.deleteChat
export const deleteUserChats = impl.deleteUserChats
