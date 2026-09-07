# Luma — UI/UX Rework v2

> Especificación de rediseño integral para convertir la interfaz actual de Luma en una experiencia de chat moderna, profesional, clara y fácil de operar.
>
> Este documento reemplaza el enfoque visual de `ui.md`, pero **preserva las capacidades funcionales actuales**: chat streaming, búsqueda, adjuntos de imagen/video, perfiles, selector de modelo, thinking por modelo, razonamiento visible, exportación, i18n, administración, usuarios, scope global/por usuario, atajos y responsive.

---

## 0. Objetivo del rework

La UI actual tiene buenas capacidades, pero demasiadas de ellas compiten visualmente al mismo tiempo. El rediseño debe priorizar jerarquía, espacio, contexto y descubribilidad.

### Problemas que deben resolverse

1. El composer no se siente como el centro del producto.
2. El selector de thinking está visualmente separado del input y parece una opción secundaria ajena al mensaje que se va a enviar.
3. Modelo y perfil viven en el footer del sidebar, lejos del lugar donde realmente afectan la conversación.
4. El sidebar mezcla navegación, búsqueda, modelo, perfil, ajustes, usuario y logout.
5. Ajustes es una vista demasiado lineal y larga; faltan categorías y sub-vistas claras.
6. Hay demasiado glassmorphism, degradado y brillo simultáneo; la identidad “nebula” termina perdiendo jerarquía.
7. El chat vacío no tiene suficiente presencia: debe sentirse como una pantalla de inicio real y no como una conversación sin mensajes.
8. Acciones como exportar, renombrar, eliminar o regenerar deben aparecer donde corresponden, no ocupar permanentemente el header.
9. Los estados de adjuntos, streaming, razonamiento, error y stop necesitan un lenguaje visual unificado.
10. Desktop y móvil deben sentirse como la misma aplicación, no como dos adaptaciones distintas.

### Resultado esperado

Luma debe sentirse como una aplicación AI-first contemporánea:

- contenido central y respirado;
- composer como pieza principal;
- controles contextuales integrados;
- navegación lateral sencilla;
- opciones complejas detrás de menús bien diseñados;
- ajustes categorizados;
- identidad visual propia sin parecer una demo de glassmorphism;
- excelente funcionamiento desde 360 px hasta pantallas ultrawide.

---

# 1. Principios de diseño

## 1.1. Menos UI permanente, más UI contextual

No mostrar controles todo el tiempo solo porque existen. Las acciones secundarias aparecen por hover, menú contextual, command palette o settings.

## 1.2. El composer manda

Modelo, thinking, perfil y adjuntos deben estar directamente asociados al mensaje que el usuario está preparando.

## 1.3. Una superficie principal por nivel

Evitar tarjetas dentro de tarjetas dentro de tarjetas. Usar separación por espacio, bordes discretos y tipografía antes que cajas visuales.

## 1.4. El acento nebula es identidad, no fondo constante

Violeta/cian/fucsia se usan en:

- foco;
- estado activo;
- logo;
- CTA principal;
- pequeños halos en empty state;
- progreso o generación.

No deben existir tres auroras fuertes detrás de toda la aplicación de forma permanente.

## 1.5. Contenido legible antes que decorativo

El ancho de lectura de las respuestas debe estar controlado. En monitores grandes el texto nunca debe extenderse de lado a lado.

## 1.6. Accesibilidad real

Todo componente interactivo debe funcionar con teclado, `focus-visible`, lectores de pantalla y targets táctiles de mínimo 40–44 px en móvil.

## 1.7. No romper funcionalidad existente

El rework es primero de shell, layout y componentes. Debe reutilizar la lógica actual del backend y stores siempre que sea posible.

---

# 2. Stack UI recomendado

Mantener React + Tailwind v4 y reemplazar componentes ad-hoc por primitivas consistentes.

## Base

- `react`
- `tailwindcss` v4
- `zustand`
- `lucide-react`
- `framer-motion`
- `sonner`
- `virtua`

## Añadir

### `shadcn/ui` + Radix UI

Usar como base para:

- Dialog
- DropdownMenu
- ContextMenu
- Popover
- Tooltip
- Tabs
- Select
- Switch
- Slider si se requiere
- ScrollArea
- Separator
- Sheet
- AlertDialog
- Command

No adoptar el aspecto visual default de shadcn sin adaptar. Se usan sus primitivas y accesibilidad, pero con tokens Luma.

### `cmdk`

Para:

- command palette;
- selector de modelos;
- buscador rápido;
- selector de perfiles cuando la lista crezca.

Si se usa el componente `Command` de shadcn, no hace falta exponer `cmdk` directamente fuera de ese wrapper.

### `vaul`

Para drawers/sheets táctiles en móvil cuando la experiencia sea mejor que un modal clásico.

### Mantener las librerías existentes

- `shiki` para código;
- `katex` para matemáticas;
- `yet-another-react-lightbox` para imágenes/video;
- `jspdf` lazy para PDF;
- pipeline actual de media y uploads.

## No añadir salvo necesidad real

- Material UI;
- Ant Design;
- Chakra;
- Bootstrap;
- otra librería completa de componentes que compita con Tailwind/shadcn.

La UI debe mantener una sola gramática visual.

---

# 3. Sistema visual “Luma 2.0”

## 3.1. Apariencia

Luma deja de ser dark-only.

Soportar:

- `system`;
- `dark`;
- `light`.

Default recomendado: `system` para instalaciones nuevas. Si se desea conservar comportamiento histórico, migrar usuarios existentes a `dark` una sola vez.

## 3.2. Paleta

### Dark

```css
--bg-app: #09090b;
--bg-sidebar: #0c0c0f;
--bg-elevated: #111116;
--bg-subtle: #15151b;
--bg-hover: #1b1b22;
--border: rgba(255,255,255,.08);
--border-strong: rgba(255,255,255,.14);
--text: #f5f5f6;
--text-muted: #a1a1aa;
--text-subtle: #71717a;
--accent: #8b5cf6;
--accent-2: #22d3ee;
--accent-3: #e879f9;
--danger: #ef4444;
--warning: #f59e0b;
--success: #22c55e;
```

### Light

```css
--bg-app: #ffffff;
--bg-sidebar: #f7f7f8;
--bg-elevated: #ffffff;
--bg-subtle: #f4f4f5;
--bg-hover: #ececef;
--border: rgba(24,24,27,.08);
--border-strong: rgba(24,24,27,.14);
--text: #18181b;
--text-muted: #52525b;
--text-subtle: #71717a;
--accent: #7c3aed;
--accent-2: #0891b2;
--accent-3: #c026d3;
--danger: #dc2626;
--warning: #d97706;
--success: #16a34a;
```

### Nebula

El degradado oficial:

```css
linear-gradient(135deg, #22d3ee 0%, #8b5cf6 52%, #e879f9 100%)
```

Reservarlo para:

- logo;
- avatar Luma;
- pequeños indicadores de generación;
- botón primario en onboarding/login;
- glow extremadamente tenue del empty state.

No usarlo como fondo de cada mensaje del usuario.

## 3.3. Tipografía

Se pueden conservar:

- Bricolage Grotesque → branding/títulos especiales;
- Instrument Sans → UI/cuerpo;
- JetBrains Mono → código/modelos/IDs.

Reducir el uso de `font-display`; el chat debe sentirse sobrio.

### Escala

```text
11–12  metadata / labels compactos
13     sidebar / toolbar
14     UI principal
15–16  mensajes
18     títulos internos
24–30  empty state
32–40  login/onboarding hero
```

## 3.4. Radios

```text
xs   8px
sm   10px
md   12px
lg   16px
xl   20px
2xl  24px
composer 26–30px
```

No aplicar `rounded-2xl` a absolutamente todo.

## 3.5. Sombras

Muy discretas.

Dark:

```css
box-shadow: 0 8px 30px rgba(0,0,0,.24);
```

Light:

```css
box-shadow: 0 8px 28px rgba(24,24,27,.08);
```

El composer flotante puede tener una sombra ligeramente más marcada que el resto de la UI.

## 3.6. Blur

Solo en overlays, menus y composer flotante cuando haya contenido detrás.

No usar `backdrop-blur-xl` en cada tarjeta.

---

# 4. Shell principal

## Desktop

```text
┌───────────────┬───────────────────────────────────────────────────┐
│               │ Header contextual                                │
│ Sidebar       ├───────────────────────────────────────────────────┤
│ 260 px        │                                                   │
│               │                 Chat / View                       │
│               │                                                   │
│               │                                                   │
│               │             composer / contenido                  │
└───────────────┴───────────────────────────────────────────────────┘
```

### Medidas

- Sidebar abierto: `260px`.
- Sidebar compacto opcional: `72px`.
- Header: `52–56px`.
- Chat content max: `820px`.
- Composer max: `860px`.
- Settings content max: `1080–1180px` según sección.

## Sidebar colapsado

En desktop, permitir colapsarlo a rail de 64–72 px.

El rail muestra únicamente:

- logo;
- nueva conversación;
- buscar;
- chats;
- settings;
- avatar usuario.

Los iconos tienen tooltip.

## Mobile

- Sidebar = Sheet desde la izquierda.
- Header = 48–52px.
- Chat = ancho completo.
- Composer = `calc(100% - 16px)` con margen 8 px, o 12 px en dispositivos más amplios.
- Menús de selector complejos = drawer inferior.

---

# 5. Sidebar v2

El sidebar se convierte únicamente en **navegación e historial**.

## 5.1. Header

Fila superior:

```text
[Luma logo] Luma                         [collapse]
```

En rail solo queda el logo.

## 5.2. Acciones principales

```text
[ +  Nueva conversación ]
[ 🔍 Buscar chats       ]
```

`Nueva conversación` debe tener alta prioridad pero no necesariamente degradado; usar surface + borde/acento al hover.

`Buscar chats` abre un Command/Dialog centrado en desktop, no necesita ocupar siempre un input completo en la barra.

## 5.3. Navegación

Añadir una mini sección de navegación superior:

- Chats
- Favoritos / fijados, si se implementa pinning
- Ajustes

No colocar modelo ni perfil aquí.

## 5.4. Historial

Agrupar conversaciones:

- Hoy
- Ayer
- Últimos 7 días
- Últimos 30 días
- Anteriores

Cada ítem:

```text
Título de conversación
```

Al hover:

```text
Título de conversación      [•••]
```

El menú `•••`:

- Renombrar
- Fijar / desfijar, si está implementado
- Exportar
- Eliminar

Eliminar usa AlertDialog. Abandonar la confirmación por doble clic: es poco descubrible y no es un patrón recomendable para una acción destructiva importante.

## 5.5. Chat activo

Usar fondo `bg-hover` o `bg-subtle`, no un bloque violeta fuerte.

Indicador opcional:

```text
2px accent bar a la izquierda
```

## 5.6. Footer

Solo usuario.

```text
[avatar] jose@...                         [⌄]
```

Click abre menú:

- Perfil/cuenta
- Ajustes
- Idioma
- Tema
- Cerrar sesión

Admin badge puede ir al lado del nombre/email dentro del menú.

### Eliminar del sidebar footer

- selector de perfil;
- selector de modelo;
- botón de logout rojo siempre visible;
- controles de thinking.

---

# 6. Header del chat

Debe ser mínimo y contextual.

## Chat nuevo

```text
[☰ desktop si sidebar cerrado]                         [••• opcional]
```

No necesita un título artificial.

## Chat existente

```text
[sidebar]   Título de conversación                 [•••]
```

El título puede truncarse y mostrar tooltip.

Menú `•••`:

- Renombrar
- Exportar → MD / JSON / PDF
- Copiar enlace local si existiera
- Eliminar conversación

No mostrar tres botones permanentes de exportación ni un botón “nuevo” redundante si el sidebar ya lo contiene.

## Mobile

```text
[☰]       Título corto                           [•••]
```

---

# 7. Nuevo chat / Empty State

Esta es una de las partes más importantes del rework.

## Desktop

Cuando no hay mensajes, el composer NO está pegado abajo.

Debe aparecer centrado aproximadamente entre 38–48% de la altura útil.

```text
                 [Luma glyph]

              ¿Qué hacemos hoy?
      Pregunta, crea, analiza o adjunta algo.

        ┌─────────────────────────────────┐
        │ Escribe un mensaje...           │
        │                                 │
        │ [+] [Modelo] [Thinking] [Perfil]│ [↑]
        └─────────────────────────────────┘

       [Analizar código] [Crear ideas]
       [Explicar algo]   [Trabajar con archivo]
```

### Reglas

- Logo máximo 44–52 px.
- Glow nebula suave solo detrás del logo/composer.
- Título 28–32 px desktop, 24–28 móvil.
- Sugerencias: chips/cards bajas de 40–48 px, no tarjetas grandes.
- Las sugerencias desaparecen o bajan opacidad al empezar a escribir.
- Al enviar el primer mensaje, el composer transiciona al footer sticky.

### Animación

- duración 180–240 ms;
- `ease-out`;
- respetar `prefers-reduced-motion`;
- no hacer zoom llamativo ni física elástica.

---

# 8. Composer v2 — pieza central

## 8.1. Estructura

```text
┌──────────────────────────────────────────────────────────┐
│ [previews de adjuntos, si existen]                       │
│                                                          │
│ Escribe un mensaje...                                    │
│                                                          │
│ [+] [Modelo ▾] [Thinking ▾] [Perfil ▾]       [Stop/Send]│
└──────────────────────────────────────────────────────────┘
```

El composer es una sola unidad visual.

### Contenedor

- fondo elevado sólido o semitransparente muy leve;
- borde 1 px;
- radio 26–30 px;
- shadow discreta;
- foco: borde ligeramente más claro + halo accent de 1–2 px, nunca neón fuerte.

## 8.2. Textarea

- placeholder: `Escribe un mensaje…`;
- sin borde propio;
- min-height 52–56 px;
- auto-grow hasta 220–260 px desktop;
- en móvil hasta aproximadamente 35–40vh;
- `Enter` envía;
- `Shift+Enter` nueva línea.

Eliminar el hint permanente debajo del composer. Los atajos se muestran en tooltip, onboarding o settings.

## 8.3. Botón `+`

Abre menú contextual:

- Adjuntar imágenes/videos
- Pegar desde portapapeles si aplica
- acciones futuras pueden vivir aquí

Para el scope actual basta con Adjuntar.

No poner un icono de clip separado si `+` ya representa acciones de composición.

## 8.4. Selector de modelo dentro del composer

Chip:

```text
[ Qwen3 32B ▾ ]
```

Click abre `CommandPopover` searchable.

### Item de modelo

```text
Qwen3 32B
Local · Vision · Thinking                   ✓
```

Opcional si capability map existe:

- `Vision`
- `Thinking`
- `Text`
- contexto conocido

Si no hay modelos descubiertos:

```text
[ Configurar modelo ]
```

Abre directamente `Settings > Models`.

### Importante

La selección sigue usando la lógica actual de modelo activo. El rediseño no debe inventar soporte backend per-message si no existe.

## 8.5. Selector Thinking dentro del composer

Chip:

```text
[ ◐ Medio ▾ ]
```

No usar cuatro emojis de colores como principal representación. Se puede usar un icono de `BrainCircuit`, `Gauge` o círculo parcial y texto.

Menú:

```text
Razonamiento

○ Off          Respuesta directa
◔ Bajo         Breve
◑ Medio        Equilibrado
● Alto         Más profundidad

Se guarda para Qwen3 32B
```

### Si el modelo no soporta thinking

Opción A preferida:

```text
[ Sin reasoning ]
```

disabled + tooltip.

Opción B:

Ocultar el chip y dejarlo aparecer solo en modelos compatibles.

Preferir A si el usuario cambia frecuentemente de modelos, porque explica por qué desapareció la capacidad.

### Persistencia

Conservar exactamente la semántica actual:

- override por modelo;
- guardado inmediato;
- default global en settings;
- `enable_thinking` boolean upstream;
- low/medium/high mapean presupuesto/hint local sin enviar campos incompatibles.

## 8.6. Perfil dentro del composer

Chip:

```text
[ ✨ Rinari ▾ ]
```

Si no hay perfil:

```text
[ Perfil ]
```

o

```text
[ Sin perfil ]
```

Selector:

- avatar/emoji;
- nombre;
- breve subtitle opcional generado desde el nombre del perfil, no desde el master prompt;
- check del activo;
- `Administrar perfiles…` al final.

No mostrar el master prompt en el selector.

## 8.7. Send / Stop

### Send

Botón circular de 36–40 px a la derecha.

Estados:

- disabled: fondo `bg-subtle`;
- enabled: accent sólido o gradiente muy suave;
- hover: +5–8% luminancia.

Icono `ArrowUp`.

### Streaming

El mismo botón se convierte en Stop:

```text
[■]
```

No crear un botón rojo separado que cambie la estructura del composer.

## 8.8. Adjuntos

Previews viven DENTRO del composer, arriba del textarea.

### Imagen

Card 72–88 px:

- thumb;
- nombre en tooltip;
- remover `×`;
- estado de procesado si aplica.

### Video

Card más ancha:

```text
[thumb] video.mp4
        12 s · 8 frames
        Subiendo 45%
```

En móvil, reducir metadatos.

## 8.9. Errores de media

Mostrar dentro del composer, debajo de previews y arriba del toolbar:

```text
[!] No se pudo subir el video. Se enviarán los frames extraídos.  [Detalles]
```

No usar toast para errores que el usuario necesita asociar a un adjunto concreto.

## 8.10. Drag & drop

Overlay sobre el área completa de chat, no solo sobre el textarea.

```text
Suelta aquí para adjuntar
Imágenes o videos
```

Usar borde dashed y fondo accent al 4–6%.

---

# 9. Transición del composer: chat nuevo → conversación

Implementar dos modos visuales del mismo componente `Composer`.

```ts
type ComposerPlacement = 'centered' | 'bottom';
```

## `centered`

Cuando:

```ts
messages.length === 0
```

## `bottom`

Cuando:

```ts
messages.length > 0
```

No renderizar dos composers distintos con estados independientes.

Debe ser el mismo árbol lógico para evitar:

- perder draft;
- perder adjuntos;
- perder foco;
- duplicar listeners;
- bugs al comenzar la conversación.

Usar layout animation solo para posición/opacity.

---

# 10. Área de conversación

## 10.1. Ancho

```text
message column max-width: 820px
text readable width: 720–760px aproximadamente
```

Código/tablas pueden romper el ancho de lectura hasta el máximo de la columna.

## 10.2. Espaciado

- 26–34 px entre turnos principales;
- 10–14 px entre bloques relacionados del mismo mensaje;
- padding horizontal desktop 24 px;
- móvil 14–16 px.

## 10.3. Fondo

Plano.

No envolver cada turno en una gran tarjeta glass.

---

# 11. Mensaje del usuario

La burbuja actual nebula→iris→flare debe desaparecer como default.

Usar:

```text
bg-subtle / bg-hover
text principal
border opcional muy tenue
```

Dark example:

```css
background: #1b1b22;
```

Light example:

```css
background: #f1f1f3;
```

### Forma

- max-width 80–85%;
- border radius 18–20 px;
- esquina inferior derecha opcionalmente 8–12 px para dirección visual;
- padding 12px 14px.

### Adjuntos

Sobre el texto, dentro del bloque del mensaje.

No recortar imágenes arbitrariamente.

### Acciones

Al hover desktop / tap menu móvil:

- Editar
- Copiar
- Eliminar

Iconos pequeños, sin fondo hasta hover.

### Editar

Editar in-place usando una variante del composer:

```text
[contenido editable]
[Cancelar] [Guardar y regenerar]
```

Si el mensaje posee adjuntos, conservarlos y permitir remover/agregar según soporte actual.

---

# 12. Mensaje del asistente

Preferir respuesta **sin burbuja**.

```text
[Luma glyph]   contenido markdown...
```

O incluso omitir avatar en turnos consecutivos si el layout queda suficientemente claro.

## Header pequeño opcional

```text
Luma
```

No mostrar “Assistant”.

## Texto

- 15–16 px;
- line-height 1.65–1.75;
- headings con jerarquía clara;
- listas con más aire;
- enlaces accent;
- selección consistente.

## Action row

Al finalizar la respuesta:

```text
[Copy] [Regenerate] [•••]
```

`•••` puede incluir:

- exportar solo respuesta;
- eliminar desde aquí;
- acciones futuras.

En desktop puede aparecer con opacity baja y subir en hover/focus. En touch siempre debe ser accesible.

---

# 13. Reasoning / pensamiento visible

Cambiar `💭 Ver pensamiento` por un componente más profesional.

Durante generación:

```text
[spinner] Pensando…
```

Si existe `reasoning_content`:

```text
[chevron] Razonamiento · 8 s
```

Expandido:

```text
┌───────────────────────────────────────┐
│ contenido reasoning                   │
│ tipografía 13–14 px, muted            │
└───────────────────────────────────────┘
```

### Reglas

- collapsed por default después de terminar;
- abierto opcionalmente mientras stream si el usuario lo abrió;
- nunca mezclar con el contenido final;
- no exportarlo salvo que la lógica actual explícitamente lo permita;
- no usar fondo violeta fuerte;
- usar surface subtle + borde izquierdo/accent tenue.

---

# 14. Streaming state

Eliminar sensación de “cursor suelto” como único indicador.

Durante streaming:

- stop activo en composer;
- sutil indicador de generación junto a avatar/nombre;
- cursor opcional al final del contenido;
- auto-scroll solo si el usuario permanece cerca del fondo.

Si el usuario hace scroll hacia arriba:

```text
[↓ Ir al final]
```

botón flotante sobre el composer.

No forzar pin al fondo contra la intención del usuario.

---

# 15. Markdown y bloques de código

Mantener GFM, KaTeX y Shiki.

## Código v2

```text
┌─────────────────────────────────────────────┐
│ typescript                    [Copiar]       │
├─────────────────────────────────────────────┤
│ const ...                                   │
└─────────────────────────────────────────────┘
```

- header compacto;
- lenguaje a la izquierda;
- copiar a la derecha;
- `overflow-x-auto`;
- no usar blur;
- radio 12–14 px;
- contraste AA.

Opcional futuro:

- Wrap lines
- Expandir

No son necesarios en primera fase.

## Tablas

- borde suave;
- header sticky solo si la tabla es alta;
- scroll horizontal en móvil;
- no reducir texto hasta hacerlo ilegible.

---

# 16. Búsqueda de conversaciones

El input permanente del sidebar se sustituye por una experiencia dedicada.

## Trigger

```text
🔍 Buscar chats
```

Shortcut:

```text
Ctrl/⌘ + K
```

La command palette puede incluir búsqueda de conversaciones y acciones globales.

## Resultados

```text
Título conversación
fragmento coincidente...
Hace 2 h
```

Agrupar o rankear por relevancia.

Resaltar match de forma sutil.

Si el backend actual busca título + contenido, mantener esa API.

---

# 17. Command Palette v2

`Ctrl/⌘ + K`

```text
┌───────────────────────────────────────────┐
│ Buscar una acción o conversación…         │
├───────────────────────────────────────────┤
│ Acciones                                  │
│  + Nueva conversación                     │
│  ⚙ Ajustes                                │
│  ⤓ Exportar conversación                  │
│                                           │
│ Conversaciones                            │
│  ...                                      │
└───────────────────────────────────────────┘
```

Acciones mínimas:

- Nueva conversación
- Buscar chats
- Ajustes
- Cambiar modelo
- Cambiar perfil
- Cambiar thinking
- Exportar chat actual
- Cambiar tema
- Cambiar idioma
- Cerrar sesión

La palette debe servir como power-user layer, no como sustituto de navegación básica.

---

# 18. Ajustes v2 — estructura completa

Ajustes deja de ser una única página vertical.

## Desktop

```text
┌────────────────────────────────────────────────────────────┐
│ Ajustes                                               [×]  │
├───────────────────┬────────────────────────────────────────┤
│ General           │                                        │
│ Apariencia        │        contenido de la sección         │
│ Conexión          │                                        │
│ Modelos           │                                        │
│ Razonamiento      │                                        │
│ Perfiles          │                                        │
│ Adjuntos          │                                        │
│ Atajos            │                                        │
│ Datos             │                                        │
│ Administración*   │                                        │
│ Acerca de         │                                        │
└───────────────────┴────────────────────────────────────────┘
```

Puede implementarse como ruta `/settings/:section` manteniendo el shell, o como dialog grande. Preferencia: **ruta/vista dedicada**, porque varias secciones son complejas.

## Mobile

Primera pantalla:

```text
Ajustes
> General
> Apariencia
> Conexión
> Modelos
> Razonamiento
...
```

Cada categoría abre una sub-vista con back.

No meter un sidebar de 220 px dentro de 390 px.

---

# 19. Settings > General

Opciones:

### Idioma

- Español
- English

Usar i18n actual.

### Comportamiento del sidebar

- Recordar abierto/cerrado
- Compactar automáticamente en pantallas medianas

### Chat

- Enviar con Enter: on/off opcional
- Autoscroll durante streaming: inteligente/default
- Mostrar sugerencias en chat nuevo: on/off

No hace falta implementar todas las opciones si no existe soporte; marcar como fase 2 en código, pero reservar la estructura.

---

# 20. Settings > Apariencia

Añadir vista que realmente permita personalizar la aplicación.

## Tema

Segmented control:

```text
[ Sistema ] [ Claro ] [ Oscuro ]
```

## Accent color

Presets:

- Nebula violeta
- Cian
- Fucsia
- Azul
- Verde
- Naranja

La identidad por defecto sigue siendo Nebula.

## Densidad

Opcional fase 2:

```text
Cómoda / Compacta
```

## Motion

```text
Reducir animaciones
```

Respetar siempre `prefers-reduced-motion` aunque este toggle esté off.

---

# 21. Settings > Conexión

Separar conexión de modelos.

## Estado

Card superior compacta:

```text
Servidor LLM                         ● Conectado
http://host:18080/v1
Última comprobación: ahora
```

Acciones:

- Probar conexión
- Editar

## Campos

- Base URL
- API key

API key:

- nunca mostrar valor real si server no lo devuelve;
- indicar `Configurada` / `No configurada`;
- botón Reemplazar;
- botón Quitar si backend lo permite.

## Scope

Si global y usuario no-admin:

```text
Gestionado por el administrador
```

No mostrar inputs editables disabled sin contexto; usar panel read-only.

---

# 22. Settings > Modelos

Nueva vista específica.

## Header

```text
Modelos
Modelos detectados en el endpoint configurado.       [Descubrir]
```

## Lista

```text
Qwen3 32B                         Predeterminado
Thinking · Vision

Qwen Coder 30B
Text · Thinking
```

Acciones item:

- Usar como predeterminado
- capability info
- configurar thinking override

## Empty

```text
No hay modelos descubiertos.
Conecta un servidor y pulsa “Descubrir modelos”.
```

CTA claro.

## Modelo actual

El modelo activo se cambia normalmente desde el composer. Settings define el **predeterminado**, no debe ser el lugar obligatorio para cambiarlo cada vez.

---

# 23. Settings > Razonamiento

Mantener funcionalidad actual, presentar mejor.

## Default

```text
Razonamiento predeterminado
[ Off ] [ Bajo ] [ Medio ] [ Alto ]
```

Texto debajo:

```text
Se aplica a modelos compatibles cuando no exista una excepción.
```

## Por modelo

Tabla/lista:

```text
Qwen3 32B                 Medio   [Cambiar]
Qwen Coder 30B            Alto    [Cambiar]
```

Menú `Cambiar`:

- Usar predeterminado
- Off
- Bajo
- Medio
- Alto

No usar una `×` ambigua para eliminar override sin explicar su efecto.

## Advanced info

Accordion:

```text
Cómo funciona el reasoning en este servidor
```

Explica que Luma adapta los niveles al formato soportado por el backend actual.

---

# 24. Settings > Perfiles

La selección diaria ocurre en el composer. Aquí solo se administran.

## Vista lista/grid

Desktop:

```text
Perfiles                                  [+ Nuevo perfil]

[avatar] Rinari                Activo
         Asistente principal      [•••]

[avatar] Coder
         Desarrollo               [•••]
```

No mostrar el master prompt completo en cada card.

## Editor de perfil

Abrir drawer/panel o sub-ruta:

```text
Nombre
Emoji / avatar
Color
Master prompt

[Cancelar] [Guardar]
```

Textarea grande para prompt.

### Admin

Si solo admin edita:

- non-admin ve lectura;
- badge `Gestionado por administrador`;
- no renderizar botones disabled innecesarios.

---

# 25. Settings > Adjuntos

Nueva vista útil para mostrar límites y comportamiento que hoy están escondidos en código.

## Límites actuales

```text
Imágenes
Hasta 6 por mensaje · 25 MB cada una

Videos
Hasta 3 por mensaje · 200 MB cada uno
```

## Procesamiento

Explicar de forma compacta:

- imágenes se optimizan antes de enviarse;
- videos generan frames para el modelo;
- el original se intenta subir para reproducción;
- si falla el upload, los frames pueden seguir utilizándose.

## Preferencias opcionales futuras

- calidad preview;
- autoplay video off/on;
- confirmar archivos grandes.

No implementar switches sin backend si solo serían decorativos.

---

# 26. Settings > Atajos

Tabla sencilla:

```text
Nueva conversación            Ctrl/⌘ N
Paleta                         Ctrl/⌘ K
Enfocar composer               /
Enviar                         Enter
Nueva línea                    Shift Enter
Cerrar modal / detener         Esc
```

Si `Escape` tiene dos acciones, priorizar:

1. cerrar overlay abierto;
2. si no hay overlay y hay streaming → stop.

---

# 27. Settings > Datos

Agrupar acciones de exportación/danger zone.

## Exportación

- Exportar chat actual MD
- Exportar chat actual JSON
- Exportar chat actual PDF

## Datos locales

Mostrar qué se guarda localmente:

- token de sesión;
- preferencias UI;
- drafts si se implementan.

## Danger zone

Separada visualmente al final:

- Borrar conversación actual
- Limpiar historial, solo si backend soporta
- Cerrar sesión en este navegador

Acciones destructivas usan AlertDialog con texto explícito.

---

# 28. Settings > Administración

Solo `admin`.

Esta sección reemplaza el concepto de mezclar controles admin con settings cotidianos.

Subtabs:

```text
Usuarios | Configuración global | System prompt | Estado
```

## 28.1. Usuarios

Tabla desktop:

```text
Usuario              Rol          Estado              Acciones
admin@luma.local      Admin        Activo               •••
user@...              User         Activo               •••
```

Acciones:

- Cambiar rol
- Resetear contraseña
- Eliminar

Crear usuario mediante Dialog dedicado.

No usar doble clic para confirmar eliminación.

Mantener reglas:

- no quitarse admin a sí mismo si rompe constraints;
- no borrarse a sí mismo;
- siempre ≥ 1 admin.

## 28.2. Configuración global

- scope global / por usuario;
- modelo default si global;
- conexión global si aplica;
- language behavior si corresponde.

Usar explicación visual del impacto antes de cambiar scope.

## 28.3. System prompt

Editor amplio.

```text
System prompt global
[ textarea/editor grande ]

Último guardado ...                    [Guardar cambios]
```

Sticky footer solo dentro de esta vista si realmente existe contenido editable largo.

## 28.4. Estado

Si endpoints existentes lo permiten:

- API Luma;
- conexión upstream;
- modelos descubiertos;
- versión app.

No inventar health metrics sin backend.

---

# 29. Settings > Acerca de

Mostrar:

- Luma
- versión frontend/backend si existe
- build/commit opcional
- licencia/repo si aplica

Nada de configuraciones operativas aquí.

---

# 30. Login v2

La pantalla actual puede conservar la identidad pero debe bajar el exceso visual.

## Layout desktop

Opción recomendada: tarjeta centrada, fondo limpio.

```text
              [Luma mark]
                 Luma
        Tu espacio de IA privado

        Email
        [________________]

        Contraseña
        [________________]

        [ Iniciar sesión ]
```

### Visual

- pequeño glow nebula detrás del logo;
- tarjeta 400–440 px;
- fondo app neutro;
- no llenar pantalla con auroras intensas;
- errores inline;
- loading dentro del botón.

---

# 31. Onboarding v2

Convertir onboarding en wizard corto, no en una página con todo mezclado.

## Step 1 — Bienvenida

```text
Configura Luma en menos de un minuto.
```

Breve descripción.

## Step 2 — Conexión

- Base URL
- API key opcional
- Probar conexión

No avanzar visualmente hasta tener una respuesta válida, salvo opción “Configurar después” si el flujo lo permite.

## Step 3 — Modelo

- Descubrir modelos
- seleccionar default
- capability badges

## Step 4 — Listo

```text
Luma está listo.
[Empezar a conversar]
```

Las “3 features” pueden existir como apoyo visual en step 1, no como cards grandes junto al formulario.

---

# 32. Estados vacíos

Cada vista debe tener empty state específico.

## Sin chats

```text
Todavía no hay conversaciones
Crea una nueva para comenzar.
```

## Sin resultados de búsqueda

```text
No encontramos conversaciones para “...”.
```

## Sin modelos

```text
No hay modelos disponibles.
Revisa la conexión o vuelve a descubrirlos.
```

## Sin perfiles

```text
No hay perfiles creados.
```

Admin recibe CTA crear; user solo texto.

---

# 33. Loading y skeletons

No usar spinner gigante para todo.

## Sidebar chats

Skeleton de 5–7 líneas.

## Settings lists

Skeleton rows/cards.

## Chat bootstrap

Mantener composer visible siempre que sea posible; cargar historial alrededor.

## Botones

Loading inline.

```text
Guardando…
Descubriendo…
Probando…
```

---

# 34. Toasts

Mantener `sonner`, pero restringirlo.

## Toast sí

- guardado exitoso no evidente;
- chat exportado;
- error global;
- modelo descubierto;
- acción completada desde menú.

## Toast no

- error de un adjunto específico;
- validación de formulario;
- error de contraseña;
- estado de upload continuo.

Esos van inline.

---

# 35. Menús y popovers

Todos los menús deben compartir:

```text
min-width 200–240px
padding 6px
item height 34–38px
radius 10–12px
shortcut alineado derecha
separator discreto
```

### Danger item

Texto rojo, pero fondo rojo solo al hover.

### Selected item

Check a la derecha o accent suave; no llenar todo de violeta.

---

# 36. Responsive detallado

## ≥ 1440 px

- sidebar 260;
- content centrado;
- no expandir message column;
- settings 1100 aprox.

## 1024–1439 px

- sidebar 248–260;
- chat igual;
- settings nav 200–220.

## 768–1023 px

- sidebar puede iniciar colapsado;
- rail opcional 64–72;
- composer max width casi completo;
- settings puede mantener sidebar compacto.

## < 768 px

- sidebar en Sheet;
- settings como navegación stack;
- header 48–52;
- controles composer compactos;
- selector de modelo/thinking/perfil abre Bottom Drawer si el popover no cabe.

## < 420 px

Composer bottom toolbar puede ser:

```text
[+] [Modelo] [Thinking]                 [↑]
```

Perfil puede moverse al menú `+` o a un segundo nivel si no cabe, pero debe seguir siendo accesible con 1–2 taps.

No truncar modelo hasta hacerlo irreconocible; usar alias corto.

---

# 37. Comportamiento de teclado

Mantener:

```text
Ctrl/⌘ + N  nueva conversación
Ctrl/⌘ + K  command palette / búsqueda
/           enfocar composer si no hay input activo
Enter       enviar
Shift+Enter nueva línea
Esc         cerrar overlay; si no hay overlay, detener generación
```

Añadir:

```text
Ctrl/⌘ + Shift + O  toggle sidebar   opcional
```

No interceptar `/` si el usuario está escribiendo en un input, textarea, contenteditable o dialog.

---

# 38. Accesibilidad

Obligatorio:

- `aria-label` en icon-only buttons;
- focus ring visible;
- navegación completa por teclado;
- `aria-expanded` en reasoning y dropdowns;
- `aria-live="polite"` para estados de upload y generación pertinentes;
- contraste mínimo suficiente;
- no depender solo de color para Off/Bajo/Medio/Alto;
- target 44 px en touch cuando sea posible;
- tooltip no puede ser el único lugar donde exista información crítica;
- respetar `prefers-reduced-motion`.

---

# 39. Arquitectura de componentes sugerida

```text
web/src/
├─ components/
│  ├─ app-shell/
│  │  ├─ AppShell.tsx
│  │  ├─ AppSidebar.tsx
│  │  ├─ SidebarRail.tsx
│  │  ├─ UserMenu.tsx
│  │  └─ MobileSidebar.tsx
│  │
│  ├─ chat/
│  │  ├─ ChatHeader.tsx
│  │  ├─ ChatEmptyState.tsx
│  │  ├─ ChatMessages.tsx
│  │  ├─ MessageTurn.tsx
│  │  ├─ UserMessage.tsx
│  │  ├─ AssistantMessage.tsx
│  │  ├─ ReasoningPanel.tsx
│  │  ├─ MessageActions.tsx
│  │  └─ ScrollToBottom.tsx
│  │
│  ├─ composer/
│  │  ├─ Composer.tsx
│  │  ├─ ComposerTextarea.tsx
│  │  ├─ ComposerToolbar.tsx
│  │  ├─ AttachmentTray.tsx
│  │  ├─ AttachmentCard.tsx
│  │  ├─ AddMenu.tsx
│  │  ├─ ModelPicker.tsx
│  │  ├─ ThinkingPicker.tsx
│  │  ├─ ProfilePicker.tsx
│  │  └─ SendButton.tsx
│  │
│  ├─ search/
│  │  ├─ CommandPalette.tsx
│  │  └─ ConversationSearchResults.tsx
│  │
│  ├─ settings/
│  │  ├─ SettingsShell.tsx
│  │  ├─ SettingsNav.tsx
│  │  ├─ GeneralSettings.tsx
│  │  ├─ AppearanceSettings.tsx
│  │  ├─ ConnectionSettings.tsx
│  │  ├─ ModelSettings.tsx
│  │  ├─ ReasoningSettings.tsx
│  │  ├─ ProfileSettings.tsx
│  │  ├─ AttachmentSettings.tsx
│  │  ├─ ShortcutSettings.tsx
│  │  ├─ DataSettings.tsx
│  │  ├─ AboutSettings.tsx
│  │  └─ admin/
│  │     ├─ AdminSettings.tsx
│  │     ├─ UsersAdmin.tsx
│  │     ├─ GlobalConfigAdmin.tsx
│  │     ├─ SystemPromptAdmin.tsx
│  │     └─ StatusAdmin.tsx
│  │
│  └─ ui/
│     └─ shadcn/radix wrappers...
│
├─ stores/
│  ├─ ui.ts
│  ├─ chat.ts
│  ├─ settings.ts
│  └─ composer.ts   // solo si realmente aporta; evitar fragmentar estado sin razón
│
└─ lib/
   ├─ ui.ts
   ├─ model-capabilities.ts
   ├─ media-config.ts
   └─ shortcuts.ts
```

No es obligatorio renombrar todos los archivos existentes de una vez. Esta es la arquitectura objetivo.

---

# 40. Estado UI sugerido

Extender `web/src/stores/ui.ts`:

```ts
type Theme = 'system' | 'light' | 'dark';
type SidebarMode = 'expanded' | 'collapsed';
type SettingsSection =
  | 'general'
  | 'appearance'
  | 'connection'
  | 'models'
  | 'reasoning'
  | 'profiles'
  | 'attachments'
  | 'shortcuts'
  | 'data'
  | 'admin'
  | 'about';

interface UIState {
  theme: Theme;
  accent: string;
  sidebarMode: SidebarMode;
  mobileSidebarOpen: boolean;
  commandOpen: boolean;
  settingsSection: SettingsSection;
}
```

Persistir solo preferencias útiles.

No persistir estados efímeros como:

- popover abierto;
- dialog abierto;
- hover;
- loading.

---

# 41. Drafts

Mejora recomendada.

Guardar draft por conversación localmente:

```ts
conversationDrafts[chatId] = {
  text,
  // adjuntos solo si su representación actual es segura/persistible
}
```

Para chat nuevo usar key especial `new`.

Si persistir adjuntos complejos representa riesgo con Object URLs/blobs, persistir únicamente texto en primera fase.

Al cambiar de chat, el usuario no debe perder lo que estaba escribiendo.

---

# 42. Modelo y perfil: alcance UX

Aunque la configuración interna pueda seguir siendo global, la UI debe comunicar que estos valores afectan la conversación actual.

## Fase segura

- seleccionar modelo desde composer;
- actualizar el mismo estado global actual;
- tooltip: `Modelo activo`;
- perfil desde composer;
- actualizar el mismo profile state actual.

## Fase futura opcional

Persistencia por conversación:

```text
chat.model
chat.profileId
```

No implementar automáticamente si requiere migración backend no prevista.

---

# 43. Gestión de cambios sin botón Guardar global

La barra inferior “Guardar si dirty” de Settings no debe existir para toda la aplicación.

Usar dos patrones:

## Guardado inmediato

Para preferencias simples:

- tema;
- idioma;
- thinking default;
- override por modelo;
- modelo default;
- perfil activo.

Mostrar toast corto solo si aporta claridad.

## Guardado explícito

Para formularios sensibles/largos:

- conexión;
- system prompt;
- editar perfil;
- crear/editar usuario.

Cada sección controla su propio estado `dirty`.

---

# 44. Microinteracciones

## Hover

120–160 ms.

## Menús

120–180 ms opacity + translateY 2–4 px.

## Sidebar

180–220 ms.

## Composer center → bottom

200–240 ms.

## Toast

Comportamiento de Sonner default adaptado al tema.

No usar:

- bounce;
- rotaciones decorativas frecuentes;
- glow pulsante constante;
- gradientes animados;
- partículas detrás del chat.

El producto debe sentirse rápido, no “demo”.

---

# 45. Iconografía

Seguir `lucide-react`.

Mapa sugerido:

```text
New chat          SquarePen / Plus
Search            Search
Settings          Settings2
Model             Box / Cpu
Thinking          BrainCircuit
Profile           Sparkles / UserRound
Attach            Plus / Paperclip dentro del menú
Send              ArrowUp
Stop              Square
More              Ellipsis
Export            Download
Copy              Copy
Regenerate        RotateCcw
Edit              Pencil
Delete            Trash2
Sidebar           PanelLeft
Theme             SunMoon
Language          Languages
Connection        PlugZap
Admin             Shield
Users             Users
```

No mezclar emojis como iconografía primaria de sistema. Los emojis quedan permitidos como parte de perfiles creados por usuarios.

---

# 46. Conversaciones largas

Mantener `virtua`.

## Requisitos

- conservar posición cuando llegan chunks;
- solo seguir streaming si el usuario está cerca del fondo;
- al editar/regenerar desde arriba, posicionar razonablemente el nuevo turno;
- evitar re-animar filas virtualizadas;
- soportar imágenes con aspect ratio reservado para reducir layout shift.

---

# 47. Lightbox

Mantener `yet-another-react-lightbox`.

Mejoras UI:

- toolbar oscura neutra;
- nombre archivo opcional;
- download no añadir si no existe permiso/endpoint;
- flechas accesibles;
- video con controles nativos;
- Escape cierra primero lightbox antes de detener generación.

---

# 48. Exportar

Mover acciones a menú contextual del chat y Settings > Data.

Menú:

```text
Exportar conversación
  Markdown
  JSON
  PDF
```

Durante generación PDF:

```text
Preparando PDF…
```

No bloquear toda la aplicación.

---

# 49. Internacionalización

Mantener:

```text
web/src/i18n/es.ts
web/src/i18n/en.ts
useI18n()
```

Todo texto nuevo de esta especificación debe pasar por i18n.

No hardcodear strings en componentes.

Agrupar keys por feature:

```ts
chat.*
composer.*
settings.general.*
settings.models.*
settings.reasoning.*
admin.users.*
```

---

# 50. Seguridad visible

Preservar comportamiento actual:

- API key no se expone al navegador si hoy está resuelta server-side;
- bearer sessions;
- uploads protegidos por mecanismo existente;
- permisos admin/user respetados.

La UI no debe inducir a pensar que una key puede “mostrarse” si el backend únicamente entrega `apiKeySet`.

Usar textos:

```text
API key configurada
Reemplazar clave
```

No:

```text
Mostrar clave
```

si realmente no está disponible.

---

# 51. Diseño de permisos

En vez de llenar Settings de inputs deshabilitados:

### Usuario sin permiso

```text
Conexión
Gestionada por el administrador.

Servidor actual
http://...
```

### Admin

Renderizar controles completos.

Esto reduce ruido y hace más obvio el scope.

---

# 52. Errores

## Chat

Error de request:

```text
No se pudo completar la respuesta.
[Reintentar] [Detalles]
```

Inline debajo del turno.

## Connection

```text
No se pudo conectar con el servidor.
ECONNREFUSED ...
```

Detalles técnicos en disclosure.

## Models

```text
No fue posible descubrir modelos.
[Reintentar]
```

## Streaming interrumpido

Mantener texto ya recibido y marcar:

```text
Generación detenida
```

No borrar la respuesta parcial.

---

# 53. Confirmaciones destructivas

Reemplazar todos los “doble clic para confirmar”.

Usar `AlertDialog`.

Ejemplo:

```text
Eliminar conversación

Esta acción eliminará permanentemente “Plan servidor LLM”.
No se puede deshacer.

[Cancelar] [Eliminar]
```

Para borrar usuario:

- mostrar email;
- indicar impacto;
- botón destructivo explícito.

---

# 54. Vista de cuenta / User menu

No hace falta crear una pantalla de perfil compleja si no existe información adicional.

El user menu puede mostrar:

```text
jose@...
Administrador

Ajustes
Idioma
Tema
──────────
Cerrar sesión
```

Si después existe cambio de contraseña propio, añadir `Cuenta` como sección Settings.

---

# 55. Suggested prompts

Mantener cuatro sugerencias en empty state, pero modernizar.

No usar textos genéricos rígidos si se puede variar por perfil.

Ejemplo default:

```text
Analiza este código
Ayúdame a planear una idea
Explícame un concepto
Trabajemos con un archivo
```

Si hay perfil activo, en fase futura se pueden definir starters por perfil.

No inventar esta propiedad en el backend durante el rework inicial.

---

# 56. Vista Chat: wireframe desktop

## Empty

```text
┌────────────────────────────────────────────────────────────────────┐
│ LUMA sidebar  │                                           header   │
│               │                                                    │
│ + New chat    │                                                    │
│ Search        │                    ◈                               │
│               │              ¿Qué hacemos hoy?                     │
│ Today         │                                                    │
│ chat 1        │       ┌────────────────────────────────────┐       │
│ chat 2        │       │ Escribe un mensaje…                │       │
│               │       │                                    │       │
│               │       │ +  Qwen3  Medio  Rinari        ↑  │       │
│               │       └────────────────────────────────────┘       │
│               │                                                    │
│               │        Analizar código   Crear ideas               │
│               │                                                    │
│ [user]        │                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Conversation

```text
┌────────────────────────────────────────────────────────────────────┐
│ sidebar       │ Plan del servidor                              ••• │
│               │────────────────────────────────────────────────────│
│               │                                                    │
│               │                       mensaje usuario               │
│               │                                                    │
│               │  ◈ Luma                                            │
│               │  Respuesta markdown...                             │
│               │  [copy] [regen] [•••]                              │
│               │                                                    │
│               │                                                    │
│               │       ┌────────────────────────────────────┐       │
│               │       │ Escribe un mensaje…                │       │
│               │       │ + Qwen3 Medio Rinari            ↑ │       │
│               │       └────────────────────────────────────┘       │
│ [user]        │                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

# 57. Vista Chat: wireframe móvil

## Empty

```text
┌──────────────────────────────┐
│ ☰        Luma             •••│
│                              │
│              ◈               │
│      ¿Qué hacemos hoy?       │
│                              │
│ ┌──────────────────────────┐ │
│ │ Escribe un mensaje…      │ │
│ │                          │ │
│ │ + Qwen3 Medio         ↑ │ │
│ └──────────────────────────┘ │
│                              │
│ [Analizar] [Ideas]           │
└──────────────────────────────┘
```

## Conversation

```text
┌──────────────────────────────┐
│ ☰  Plan del servidor      •••│
│──────────────────────────────│
│                              │
│              user message    │
│                              │
│ ◈ Luma                       │
│ respuesta...                 │
│                              │
│                              │
│ ┌──────────────────────────┐ │
│ │ Escribe un mensaje…      │ │
│ │ + Qwen3 Medio         ↑ │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Perfil puede quedar dentro del menú de toolbar cuando el ancho no alcance.

---

# 58. Diseño del selector de modelos

Popover desktop, drawer mobile.

```text
Seleccionar modelo
[ Buscar modelos... ]

Recomendados / disponibles

✓ Qwen3 32B
  Thinking · Vision

  Qwen Coder 30B
  Thinking · Text

────────────────────
Administrar modelos
```

Si existen nombres técnicos muy largos, mostrar:

```text
Qwen3-Coder-Next-Q4_K_M
```

con `font-mono` 12–13 px y ellipsis, tooltip con nombre completo.

---

# 59. Diseño del selector Thinking

```text
Razonamiento

○ Off
  Prioriza velocidad y respuesta directa.

◔ Bajo
  Razonamiento breve.

◑ Medio                           ✓
  Balance entre velocidad y profundidad.

● Alto
  Mayor presupuesto para problemas complejos.

────────────────────────────────
Configuración avanzada
```

No prometer diferencias que el backend no puede garantizar; estos textos describen intención local.

---

# 60. Diseño del selector de perfiles

```text
Perfil

○ Sin perfil
  Solo system prompt

✨ Rinari                           ✓
   Perfil activo

🛠 Developer
   Perfil de desarrollo

────────────────────────────
Administrar perfiles
```

El color del perfil aparece en avatar/dot, no como fondo entero del item.

---

# 61. Evitar estos patrones

1. Degradado en todas las burbujas.
2. Glassmorphism en todas las surfaces.
3. Tres selectores en el footer del sidebar.
4. Thinking debajo del composer como una línea separada.
5. Ajustes como una única lista de 1000 px de altura.
6. Botones destructivos siempre rojos y visibles.
7. Doble clic como confirmación.
8. Tooltips como única explicación.
9. Emojis como iconografía principal de sistema.
10. Chat vacío con composer pegado abajo.
11. Ancho de lectura ilimitado en ultrawide.
12. Animar cada mensaje de una lista virtualizada.
13. Ocultar opciones críticas en un único menú “hamburger” sin contexto.
14. Añadir librerías que dupliquen Radix/shadcn.
15. Crear features visuales que el backend no soporta.

---

# 62. Migración desde la UI actual

## Mantener sin cambios funcionales inicialmente

- login/token;
- onboarding API;
- base URL;
- API key handling;
- `/models` discovery;
- SSE;
- `reasoning_content`;
- media pipeline;
- uploads;
- export MD/JSON/PDF;
- perfiles;
- system prompt composition;
- roles;
- scope;
- i18n;
- virtualization.

## Cambiar ubicación/UX

| Actual | Nuevo |
|---|---|
| Modelo en footer sidebar | Modelo en composer |
| Perfil en footer sidebar | Perfil en composer |
| Thinking debajo del hint | Thinking en toolbar del composer |
| Ajustes página única | Settings con navegación por categorías |
| Export botones header | Menú `•••` + Settings > Data |
| Trash hover + doble clic | Menú contextual + AlertDialog |
| Gradiente fuerte user bubble | Surface neutral |
| Assistant bubble/avatar fuerte | Respuesta abierta, minimal |
| Chat vacío con composer abajo | Composer centrado |
| Search input siempre visible | Search command/dialog |
| Dark-only | System/Light/Dark |
| Auroras permanentes | Nebula como acento |

---

# 63. Fases de implementación

## Fase 1 — Design system + shell

1. Introducir tokens CSS theme-aware.
2. Preparar componentes shadcn/Radix necesarios.
3. Rehacer AppShell.
4. Sidebar v2.
5. Header v2.
6. theme system/light/dark.

No tocar aún chat logic profundo.

## Fase 2 — Composer v2

1. Unificar composer centered/bottom.
2. Integrar ModelPicker.
3. Integrar ThinkingPicker.
4. Integrar ProfilePicker.
5. Migrar Attachments tray.
6. Send/Stop único.
7. DnD overlay.

Esta fase es prioritaria.

## Fase 3 — Mensajes

1. UserMessage neutral.
2. AssistantMessage sin card pesada.
3. ReasoningPanel.
4. MessageActions.
5. Scroll-to-bottom behavior.
6. code block polish.

## Fase 4 — Settings

1. SettingsShell.
2. General.
3. Appearance.
4. Connection.
5. Models.
6. Reasoning.
7. Profiles.
8. Attachments.
9. Shortcuts.
10. Data.
11. Admin.
12. About.

## Fase 5 — Login/onboarding

1. Login polish.
2. Wizard onboarding.
3. error/loading states.

## Fase 6 — QA

- desktop;
- tablet;
- mobile;
- keyboard;
- screen reader basics;
- long chats;
- long code blocks;
- uploads grandes;
- thinking stream;
- user/admin;
- global/per-user scope;
- ES/EN;
- light/dark/system.

---

# 64. Criterios de aceptación

El rework NO se considera terminado hasta cumplir:

## Chat nuevo

- [x] Composer centrado.
- [x] Modelo dentro del composer.
- [x] Thinking dentro del composer.
- [x] Perfil dentro del composer o accesible desde su toolbar en móvil.
- [x] Sugerencias visibles sin competir con el composer.
- [x] Al enviar, el mismo composer pasa al bottom sin perder estado.

## Sidebar

- [x] No contiene selectores de modelo/thinking/perfil.
- [x] Historial agrupado.
- [x] Menú contextual por chat.
- [x] Footer solo de cuenta.
- [x] Colapsable en desktop.
- [x] Drawer en mobile.

## Chat

- [x] Mensaje user neutral.
- [x] Respuesta assistant sin card pesada.
- [x] Reasoning profesional y colapsable.
- [x] Stop integrado en Send.
- [x] Scroll inteligente.
- [x] Virtualización intacta.

## Settings

- [x] Navegación por categorías.
- [x] Modelos tienen vista propia.
- [x] Razonamiento tiene vista propia.
- [x] Apariencia tiene vista propia.
- [x] Adjuntos tienen vista propia.
- [x] Admin está separado.
- [x] No existe una barra global de Guardar para todo.

## Visual

- [x] Dark y Light.
- [x] System theme.
- [x] Nebula usado como acento.
- [x] Sin auroras fuertes permanentes.
- [ ] Sin glassmorphism excesivo.
- [ ] Tipografía y spacing consistentes.

## Responsive

- [ ] 360 px usable.
- [ ] 390/430 px usable.
- [ ] 768 px usable.
- [ ] 1024 px usable.
- [ ] 1440 px usable.
- [ ] 2560 px no estira el texto.

## Seguridad/roles

- [ ] API key continúa protegida.
- [ ] User no ve controles admin editables.
- [ ] Admin conserva gestión completa.
- [ ] Scope global/per-user no cambia de semántica.

---

# 65. Definition of Done técnica

- sin errores TypeScript;
- sin warnings React relevantes;
- lint limpio;
- build production exitoso;
- no regressions en uploads;
- no regressions SSE;
- no regressions en stop;
- no regressions en regenerate/edit/delete;
- no regressions en export;
- no regressions en i18n;
- navegación teclado funcional;
- `prefers-reduced-motion` validado;
- temas sin flashes incorrectos al cargar;
- menús/dialogs no se cortan por `overflow`;
- mobile sin scroll horizontal accidental;
- textarea mantiene draft al cambiar de vista si se implementa draft persistence.

---

# 66. Instrucciones directas para el LLM/agente que implemente

1. Leer primero la UI actual y reutilizar la lógica existente.
2. No reescribir backend por estética.
3. No eliminar funciones actuales durante el rework.
4. Antes de crear un componente nuevo, revisar si shadcn/Radix ya cubre la primitiva.
5. No duplicar estado de modelo, thinking, perfil o adjuntos.
6. `Composer` debe ser una sola instancia lógica tanto centrada como sticky.
7. Mover modelo/thinking/perfil al composer sin alterar su persistencia actual durante la primera fase.
8. Reemplazar confirmaciones por doble clic con `AlertDialog`.
9. Convertir Settings en navegación por secciones.
10. Implementar primero estructura y usabilidad; después polish visual.
11. No usar degradados/blur como solución por defecto.
12. No introducir features fake o botones sin implementación.
13. Mantener ES/EN desde el primer commit del rework.
14. Mantener accesibilidad de todas las primitivas.
15. Validar móvil desde el principio, no al final.
16. Conservar `virtua` y evitar animaciones por fila.
17. Conservar Shiki/KaTeX/lightbox/media pipeline.
18. Conservar semántica real de thinking y nunca enviar parámetros upstream incompatibles.
19. Conservar permisos admin/user y scope existente.
20. Actualizar `ui.md` o reemplazarlo por este documento cuando la implementación quede finalizada.

---

# 67. Prioridad visual final

Cuando haya duda entre dos diseños, priorizar en este orden:

```text
1. Claridad
2. Velocidad de uso
3. Jerarquía
4. Consistencia
5. Accesibilidad
6. Identidad Luma
7. Decoración
```

Luma debe sentirse como una herramienta profesional que casualmente tiene una identidad nebula, no como una identidad nebula a la que luego se le agregó un chat.

---

# 68. Resumen ejecutivo del cambio

La experiencia final debe ser:

- **Sidebar simple** para chats y cuenta.
- **Chat nuevo centrado** con presencia clara.
- **Composer moderno** que contiene adjuntos, modelo, thinking, perfil y send/stop.
- **Conversación limpia** con user bubbles discretas y respuestas Luma abiertas.
- **Reasoning integrado** de forma profesional.
- **Settings por categorías**, con vistas específicas para conexión, modelos, reasoning, perfiles, adjuntos y administración.
- **Dark/light/system**, con nebula como acento.
- **Responsive real** y mobile-first en los controles complejos.
- **Misma lógica backend**, salvo mejoras futuras explícitas.

Este rework debe ser visualmente reconocible como una versión completamente nueva de Luma aunque internamente siga aprovechando la arquitectura y capacidades ya construidas.
