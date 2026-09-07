<div align="center">

  <p align="center">
    <img src="web/public/logo.png" alt="Luma" width="220"/>
  </p>

  <img src="https://img.shields.io/badge/status-en%20producci%C3%B3n-8b5cf6?style=flat-square" alt="Estado"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify"/>
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/SQLite-default-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/PostgreSQL-opcional-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL opcional"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose"/>
  <img src="https://img.shields.io/badge/OpenAI-compatible-10A37F?style=flat-square&logo=openai&logoColor=white" alt="OpenAI compatible"/>

# Luma

### Tu IA, sin cadenas.

Un chat moderno para cualquier servidor **OpenAI-compatible** — respuestas en **streaming**, **imágenes** como adjunto, descubrimiento de **modelos** al vuelo y una interfaz oscura con animaciones fluidas.

Hecho para tu LLM local, **sin censura ni restricciones**.

</div>

---

## ✨ Características

- ⚡ **Streaming en tiempo real** — respuestas token a token con cursor parpadeante
- 🖼️ **Adjunta imágenes** — arrastra, pega o sube capturas (redimensionadas al vuelo)
- 🎬 **Adjunta videos** — frames adaptativos (2–12 según duración, con dedupe), thumbnail y subida del original para playback (`POST /api/uploads`, máx 200 MB)
- 🧠 **Thinking por modelo** — niveles Off/Bajo/Medio/Alto (mapeo verificado contra llama.cpp: solo `enable_thinking`; otros params cuelgan el worker), con pensamiento visible en vivo y por historial
- 🧠 **Descubrimiento de modelos** — consulta `GET /models` de tu servidor con un clic
- 💬 **Sidebar con historial** — conversaciones persistentes, renombrado y borrado
- 🛠️ **Ajustes completos** — URL base, API key, modelo, temperatura, tokens y prompt de sistema
- 👤 **Perfiles** — master prompt adicional al system prompt, con emoji y color; perfil activo global
- 🔐 **API key protegida** — nunca viaja al navegador; se guarda enmascarada en el backend
- 🎨 **Diseño nebula** — dark theme con auroras, grano sutil, glassmorphism y micro-animaciones (framer-motion)

## 🚀 Despliegue rápido (Docker Compose)

```bash
git clone git@github.com:Xainner/Luma.git
cd Luma
cp .env.example .env        # SQLite por defecto; no requiere configurar nada más
docker compose up -d --build
```

La app queda en **`http://localhost:17015`**.

En el primer arranque se muestra un _onboarding_: pega la URL base de tu servidor (p. ej. `http://192.168.0.3:8021/v1`), opcionalmente tu API key y pulsa **Descubrir modelos** para seleccionar el tuyo.

## 🗄️ Base de datos

La base de datos se elige con `DATABASE_TYPE` en el `.env`:

- **`sqlite`** _(por defecto)_ — sin servidor externo. El archivo vive en `DATABASE_PATH` (`./data/luma.db` por defecto; en Docker se monta como volumen en `/app/data`).
- **`postgres`** _(opcional)_ — requiere el servicio `db` y una `DATABASE_URL`.

Con SQLite solo necesitas Docker Compose para la app:

```bash
cp .env.example .env
docker compose up -d --build
```

Con PostgreSQL:

```bash
# .env: DATABASE_TYPE=postgres, define POSTGRES_PASSWORD y DATABASE_URL
docker compose --profile postgres up -d --build
```

> **Actualizando desde una instalación existente con Postgres:** el cambio a SQLite por defecto solo aplica a instalaciones nuevas. Si ya tenés datos en Postgres (`./db-data`), mantené tu instalación actual seteando `DATABASE_TYPE=postgres` en `.env` antes de actualizar; de lo contrario la app arrancaría con una base SQLite vacía.

## 👤 Perfiles

Cada **perfil** aporta un _master prompt_ que se añade al _system prompt_ de Ajustes en cada conversación:

```
system prompt (Ajustes)  +  "\n\n"  +  master prompt (perfil activo)
```

- Se administran en **Ajustes → Perfiles**: nombre, emoji, color y master prompt
- El perfil **activo** se elige desde el sidebar o desde Ajustes y aplica a todos los chats
- Si no hay perfil activo, solo se usa el system prompt de Ajustes

## 🏗️ Arquitectura

```
Luma/
├── web/          Frontend — React 19 + Vite + TypeScript + Tailwind v4 + framer-motion
│   └── public/   Logo e íconos (logo.png, favicon.png)
├── server/       Backend  — Fastify 5 (proxy de streaming SSE, CRUD, modelos)
│   └── src/      Persistencia dual — SQLite (default, better-sqlite3) o PostgreSQL 16 (pg)
└── docker-compose.yml  App (+ Postgres opcional con perfil `postgres`), puerto 17015
```

| Capa     | Tecnología                                               |
| -------- | -------------------------------------------------------- |
| Frontend | React 19, Vite 6, TypeScript, Tailwind 4, Motion         |
| Backend  | Fastify 5, Node 22, streaming SSE                        |
| Datos    | SQLite (default) o PostgreSQL 16 (`app_config`, `chats`) |
| Infra    | Docker Compose, `restart: unless-stopped`                |

### Endpoints

| Método | Ruta                | Descripción                                               |
| ------ | ------------------- | --------------------------------------------------------- |
| GET    | `/api/config`       | Configuración actual (key enmascarada)                    |
| POST   | `/api/config`       | Guardar configuración                                     |
| GET    | `/api/models`       | Descubrir modelos (usa la config o headers `x-luma-base`) |
| POST   | `/api/chat`         | Completar chat con **streaming SSE**                      |
| GET    | `/api/chats`        | Listar conversaciones                                     |
| POST   | `/api/chats`        | Crear conversación                                        |
| GET    | `/api/chats/:id`    | Ver conversación completa                                 |
| PUT    | `/api/chats/:id`    | Actualizar conversación                                   |
| DELETE | `/api/chats/:id`    | Eliminar conversación                                     |
| DELETE | `/api/data`         | Borrar todos los chats                                    |
| GET    | `/api/profiles`     | Listar perfiles                                           |
| POST   | `/api/profiles`     | Crear perfil                                              |
| PUT    | `/api/profiles/:id` | Actualizar perfil                                         |
| DELETE | `/api/profiles/:id` | Eliminar perfil                                           |

## 🛠️ Desarrollo local

```bash
npm install
npm run dev    # arranca backend (:3001) y frontend Vite (:5173, proxy a /api)
```

Por defecto usa **SQLite** (`./server/data/luma.db`). Si querés Postgres en local:

```bash
docker compose --profile postgres up -d db
DATABASE_TYPE=postgres DATABASE_URL=postgres://luma:change-me@localhost:17016/luma npm run dev
```

## 🔄 Actualizar el despliegue

```bash
git pull --ff-only && docker compose up -d --build
```

---

<div align="center">

Hecho con 💜 para chatear libre con tu LLM local.

</div>
