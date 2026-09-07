# Luma — UI

Documento vivo de cómo está la interfaz hoy: qué muestra cada pantalla, cómo se
muestra y con qué reglas. Si cambias la UI, actualiza este archivo.

Idiomas: español / inglés (conmutador en paleta y Ajustes). Todo el texto sale
de `web/src/i18n/{es,en}.ts` vía `useI18n()`.

---

## 1. Tema “nebula”

Dark-only (`color-scheme: dark`). Fondo `ink-950` (`#05060c`) con tres auroras
fijas (violeta, cian, fucsia) + grano de ruido sutil (`body::before/::after` en
`web/src/index.css`). Tarjetas: `ink-900/70` con `backdrop-blur-xl`, bordes
`white/10`, radios `rounded-2xl`.

| Rol      | Tokens (Tailwind v4, `@theme`)                                                |
| -------- | ----------------------------------------------------------------------------- |
| Fondo    | `ink-950 #05060c`, `ink-900 #0a0c16`, `ink-850 #0e1120`, `ink-800 #141828`    |
| Texto    | `mist-100 #eef1f8` (principal), `mist-400/500/600` (secundario/deshabilitado) |
| Acento 1 | `nebula` cian `#22d3ee` (focos, links, progreso)                              |
| Acento 2 | `iris` violeta `#8b5cf6` (chat activo, badges admin, degradados)              |
| Acento 3 | `flare` fucsia `#e879f9` (extremo del degradado)                              |
| Peligro  | rojo `red-400/500` (borrar, detener, zona de peligro)                         |
| OK       | `nebula-300`/verde inline (`Check`) para “copiado/guardado”                   |

Tipografías (Google Fonts): **Bricolage Grotesque** (`font-display`, títulos y
logo), **Instrument Sans** (`font-sans`, cuerpo), **JetBrains Mono**
(`font-mono`, código y modelos). Selección violeta, scrollbar fino 8px,
`focus-visible` cian. Clases compartidas en `web/src/lib/ui.ts`: `inputClass`
(inputs/selects) y `labelClass`.

Iconos: `lucide-react`. Animación: `framer-motion` (transiciones de vista,
sidebar, dropdowns; la lista de mensajes está virtualizada y no anima por fila).
Toasts: `sonner` (`<Toaster theme="dark" bottom-center>`, 3.5s) para errores sin
UI local (crear chat, guardar, borrar).

---

## 2. Pantallas y flujo

```
sin token → Login → (sin baseUrl → Onboarding) → Chat ⇄ Ajustes
```

- **Login** (`Login.tsx`): logo grande, email + contraseña, “Tu IA, sin
  cadenas. Inicia sesión para continuar.” Token en `localStorage` (`luma.token`).
- **Onboarding** (primera vez, sin `baseUrl`): hero + 3 features (streaming,
  adjuntos, ajustes), campo URL base (`http://host:puerto/v1`), API key
  opcional, **Descubrir modelos** (`GET /models` del servidor) y selector del
  modelo. Si el scope es global y no eres admin, sale bloqueado.
- **Chat** (`ChatView.tsx`): header (título, exportar, nuevo), lista
  virtualizada (`virtua`, pin al fondo durante streaming), composer abajo. Vacío:
  logo con ping + “¿En qué te ayudo hoy?” + 4 sugerencias clicables.
- **Ajustes** (`SettingsView.tsx`): vuelve con ←. Secciones: Conexión + Modelo,
  Razonamiento, System prompt, Perfiles, Zona de peligro. Barra inferior con
  Guardar (solo si hay cambios `dirty`).

Responsive: sidebar fija en `lg`, drawer con overlay en móvil; header del chat
colapsa etiquetas a iconos en `sm`.

---

## 3. Sidebar (izquierda, `w-72`)

Header con logo + “Luma” y botón de cerrar (solo móvil). Debajo:

1. **Nueva conversación** (botón, `+` rota 90° en hover).
2. **Buscador** con debounce 300 ms (busca título + contenido en el server) y ✕
   para limpiar.
3. **Lista de conversaciones**: título truncado + tiempo relativo
   (`Intl.RelativeTimeFormat`, “hace 5 min”). Activa resaltada en violeta.
   Basura roja al hover para borrar (con confirmación vía doble clic).
4. Footer:
   - **Perfil** (select con `emoji nombre`; “Sin perfil” = solo system prompt).
   - **Modelo activo** (select con lo descubierto; “Descubre modelos en
     Ajustes” si está vacío).
   - Botón **Ajustes**.
   - Usuario: avatar con inicial en degradado, email y rol
     (**Administrador**/**Usuario**), y logout rojo.

Todo emite hacia `App.tsx` (`onSelect`, `onNew`, `onDelete`, `onModelChange`,
`onProfileChange`…); el estado de shell (vista/sidebar/paleta) vive en el store
`web/src/stores/ui.ts` (zustand).

---

## 4. Mensajes (`MessageBubble.tsx`)

- **Usuario** (derecha): burbuja en degradado nebula→iris→flare, texto
  `whitespace-pre-wrap`, máx 85% (75% en `sm`). Adjuntos arriba del texto:
  imágenes en grid (1–2 col) clicables con `cursor-zoom-in`; videos con
  controles inline o tarjeta con thumb + `🎬 nombre · 12s · 8 frames al modelo`.
  Hover muestra ✏️ editar (textarea inline + Guardar/Cancelar) y 🗑 borrar.
- **Asistente** (izquierda): avatar ✨ en degradado + Markdown (`Markdown.tsx`:
  GFM, tablas con scroll, links externos, código con header de lenguaje + botón
  copiar). Si hubo razonamiento, disclosure `💭 Ver pensamiento` colapsable con
  el `reasoning_content` en vivo e historial. Cursor parpadeante mientras
  genera. Solo el último mensaje muestra copiar / regenerar.
- **Código**: resaltado Shiki (github-dark, lazy al primer bloque, fallback a
  `<pre>` pelado) y **mates** KaTeX en chunk aparte que solo carga si el texto
  trae `$…$`/`$$…$$`.
- **Exportar** (header del chat y paleta `Ctrl+K`): MD, JSON y PDF (jsPDF en
  chunk lazy; el MD anota videos como `> 🎬 Video adjunto: …`).
- **Lightbox** (`yet-another-react-lightbox`): click en imagen la abre grande
  con navegación; los videos abren con reproducción (autoplay + poster) desde
  el botón ⛶ o el thumb. Sin videos reproducibles se muestra el thumb.

---

## 5. Composer (entrada)

Caja `ink-900/85` con borde que se ilumina en foco (`focus-within`). Textarea
auto-creciente (máx 180px): `Enter` envía, `Shift+Enter` salta línea, pegar
archivos los adjunta. Drag & drop con overlay punteado (“Suelta las imágenes o
videos aquí”).

- Previews: thumbs 64px (imágenes con su dataUrl, videos con preview en memoria
  o thumb + badge `Nf` de frames), ✕ con `revokeObjectURL` incluido.
- Estado: `⏳ Procesando video: nombre · frame 3/8…` / `…subiendo 45%…` y errores
  en ámbar inline (límite alcanzado, peso excedido, subida fallida con degradado
  a “solo frames”).
- Botones: 📎 adjuntar (`image/*,video/*`, múltiple), degradado para enviar
  (disabled sin contenido), rojo ⏹ para detener durante streaming.
- Debajo del hint va el **selector de thinking** (🧠 Off/Bajo/Medio/Alto, ver §7)
  con tooltip del modelo al que aplica.

Límites (`web/src/lib/media-config.ts`, espejo en server): 6 imágenes, 3 videos,
25 MB/imagen, 200 MB/video.

---

## 6. Adjuntos: qué ve el usuario

| Paso         | Imágenes                                                                        | Videos                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preparar     | Downscale a 1080px JPEG q0.85, se guardan `width/height` reales                 | Frames adaptativos 2–12 (1 c/4s, dedupe de escenas, 720p q0.7) + thumb 480px + duración/resolución; se sube el original a `/api/uploads` con progreso (sin subida → igual sirven los frames) |
| En el chat   | Completas, sin recorte (`object-contain` sobre `bg-black/40`, aspect reservado) | Reproductor inline (vía upload) o tarjeta con thumb si no hay original                                                                                                                       |
| Persistencia | dataUrl + dimensiones en el chat                                                | Solo frames + thumb + meta + `uploadId` (el blob completo nunca va a la DB)                                                                                                                  |
| Al modelo    | `image_url` tal cual                                                            | Cada frame como `image_url` + aviso de tokens estimados                                                                                                                                      |

---

## 7. Thinking / razonamiento

Niveles estilo Hermes — `⚪ Off · 🟢 Bajo · 🟡 Medio · 🔴 Alto` — en dos sitios:

1. **Composer**: dropdown compacto bajo el hint. Escribe un **override por
   modelo** (`modelThinking[modelo] = nivel`, guardado inmediato).
2. **Ajustes → Razonamiento**: nivel por defecto global + lista de excepciones
   por modelo (cambiar nivel o ✕ para quitar). Nota: “Solo aplica a modelos con
   thinking (Qwen). Otros modelos lo ignoran.”

Semántica real (capability map verificado contra llama.cpp en
`server/src/chat-payload.ts`): el upstream **solo** entiende `enable_thinking`
booleano — `reasoning_effort` y cía cuelgan el worker y jamás se envían. Off =
`enable_thinking:false` (respuesta directa, ~1.6s vs ~33s); low/medium/high =
thinking on + piso de `max_tokens` (1024/4096/8192, el thinking se come el
presupuesto) + hint de sistema (breve/nada/a fondo). El pensamiento llega por
`reasoning_content` en el SSE y se muestra en el disclosure 💭 sin contaminar
la respuesta ni el export.

---

## 8. Perfiles

Un perfil = nombre + emoji + color + **master prompt** que se concatena al
system prompt de Ajustes (`system + "\n\n" + master`). Sin perfil activo, solo
el system prompt.

- **Seleccionar**: select del footer del sidebar (aplica global, a todos los
  chats) o el mismo select en Ajustes. Cambio = guardado inmediato.
- **Administrar** (solo admin, Ajustes → Perfiles): tarjetas con avatar de color
  (`color+22` fondo, `color+55` borde), nombre/emoji editables, 6 colores
  preset, textarea de master prompt, Guardar (con estado “Guardado ✓”), activar
  y borrado con doble clic. No-admin ve la lista en lectura + badge “activo”.

---

## 9. Usuarios y administrador

Roles: `admin` / `user`. Seed inicial: `admin@luma.local`. El sidebar muestra el
rol bajo el email.

- **Scope global** (default): la conexión/modelo/thinking los edita solo el
  admin; el resto ve aviso de solo-lectura. Perfiles: creación/edición solo
  admin.
- **Scope por usuario** (lo cambia el admin): cada uno guarda su baseUrl, key,
  modelo, thinking, perfil e idioma; el system prompt sigue siendo global.
- **AdminPanel** (Ajustes, solo admin): editor del system prompt global,
  conmutador de scope y **gestión de usuarios** (crear con email+clave+rol,
  cambiar rol, resetear clave, eliminar con doble confirmación; no puedes
  quitarte admin ni borrarte a ti mismo; siempre queda ≥1 admin).

Seguridad visible: la API key nunca viaja al navegador (se muestra enmascarada,
`apiKeySet` booleano); sesiones por Bearer token; binarios de `/api/uploads`
aceptan `?token=` porque `<video>` no manda headers.

---

## 10. Atajos y paleta

`Ctrl/⌘+K` paleta (nuevo chat, ajustes, exportar MD/JSON/PDF, cambiar idioma,
salir) · `Ctrl/⌘+N` nuevo chat · `Escape` cierra paleta o detiene generación ·
`/` enfoca el composer. Regenerar/editar/borrar mensajes re-lanza generación
desde ese punto; el título se autotitula con el LLM (máx 6 palabras) en el
primer mensaje.
