/**
 * Backfill privado: pone width/height a las imágenes viejas que no los tienen.
 * Solo lee HEADERS del dataUrl (dimensiones); jamás guarda, muestra ni exporta
 * píxeles. El log reporta únicamente conteos.
 *
 * Uso:
 *   npx tsx scripts/backfill-image-dims.ts --dry-run
 *   npx tsx scripts/backfill-image-dims.ts --apply
 */
import { getChat, initDb, listChats, listUsers, saveChat } from '../src/db.js'
import { dataUrlDimensions } from '../src/image-dims.js'

const apply = process.argv.includes('--apply')

let chatsTouched = 0
let imagesFixed = 0
let imagesSkipped = 0

await initDb()
const users = await listUsers()
for (const u of users) {
  const metas = await listChats(u.id)
  for (const meta of metas) {
    const chat = await getChat(meta.id, u.id)
    if (!chat) continue
    let dirty = false
    for (const m of chat.messages) {
      for (const img of m.images ?? []) {
        if ((img.width && img.height) || !img.dataUrl) continue
        const dims = dataUrlDimensions(img.dataUrl)
        if (dims) {
          img.width = dims.width
          img.height = dims.height
          imagesFixed++
          dirty = true
        } else {
          imagesSkipped++
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
  `${apply ? 'APLICADO' : 'DRY-RUN'}: ${imagesFixed} imágenes en ${chatsTouched} chats` +
    (imagesSkipped ? ` (${imagesSkipped} ilegibles, se dejan igual).` : '.'),
)
if (!apply) console.log('Repite con --apply para escribir los cambios.')
process.exit(0)
