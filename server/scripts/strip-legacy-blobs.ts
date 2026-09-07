/**
 * Migración one-shot: elimina los `dataUrl` legacy (video completo en base64)
 * de los chats persistidos. Conserva frames, thumb y metadata — que es lo que
 * el modelo realmente vio — y reporta bytes liberados.
 *
 * Uso:
 *   DATABASE_TYPE=... DATABASE_URL=... npx tsx scripts/strip-legacy-blobs.ts --dry-run
 *   DATABASE_TYPE=... DATABASE_URL=... npx tsx scripts/strip-legacy-blobs.ts --apply
 */
import { getChat, initDb, listChats, listUsers, saveChat } from '../src/db.js'

const apply = process.argv.includes('--apply')

let chatsTouched = 0
let videosStripped = 0
let bytesFreed = 0

await initDb()
const users = await listUsers()
for (const u of users) {
  const metas = await listChats(u.id)
  for (const meta of metas) {
    const chat = await getChat(meta.id, u.id)
    if (!chat) continue
    let dirty = false
    for (const m of chat.messages) {
      for (const v of m.videos ?? []) {
        if (typeof v.dataUrl === 'string' && v.dataUrl.length > 0) {
          bytesFreed += v.dataUrl.length
          videosStripped++
          if (!v.thumb && v.frames.length > 0) v.thumb = v.frames[0]
          delete v.dataUrl
          dirty = true
        }
      }
    }
    if (dirty) {
      chatsTouched++
      if (apply) await saveChat({ ...chat, updatedAt: Date.now() }, u.id)
    }
  }
}

console.log(
  `${apply ? 'APLICADO' : 'DRY-RUN'}: ${videosStripped} videos en ${chatsTouched} chats, ~${(bytesFreed / 1048576).toFixed(1)} MB liberados.`,
)
if (!apply) console.log('Repite con --apply para escribir los cambios.')
process.exit(0)
