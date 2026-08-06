<div align="center">

  <img src="https://img.shields.io/badge/status-en%20producci%C3%B3n-8b5cf6?style=flat-square" alt="Estado"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify"/>
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
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
- 🧠 **Descubrimiento de modelos** — consulta `GET /models` de tu servidor con un clic
- 💬 **Sidebar con historial** — conversaciones persistentes, renombrado y borrado
- 🛠️ **Ajustes completos** — URL base, API key, modelo, temperatura, tokens y prompt de sistema
- 🔐 **API key protegida** — nunca viaja al navegador; se guarda enmascarada en el backend
- 🎨 **Diseño nebula** — dark theme con auroras, grano sutil, glassmorphism y micro-animaciones (framer-motion)

## 🚀 Despliegue rápido (Docker Compose)

```bash
git clone git@github.com:Xainner/Luma.git
cd Luma
cp .env.example .env        # edita POSTGRES_PASSWORD
docker compose up -d --build
```

La app queda en **`http://localhost:17015`** (BD en `17016`).

En el primer arranque se muestra un *onboarding*: pega la URL base de tu servidor (p. ej. `http://192.168.0.3:8021/v1`), opcionalmente tu API key y pulsa **Descubrir modelos** para seleccionar el tuyo.

## 🏗️ Arquitectura

```
Luma/
├── web/          Frontend — React 19 + Vite + TypeScript + Tailwind v4 + framer-motion
├── server/       Backend  — Fastify 5 (proxy de streaming SSE, CRUD, modelos)
│   └── src/db.ts Persistencia — PostgreSQL 16 (config + chats JSONB)
└── docker-compose.yml  App + Postgres, puertos 17015 / 17016
```

| Capa        | Tecnología                                    |
| ----------- | --------------------------------------------- |
| Frontend    | React 19, Vite 6, TypeScript, Tailwind 4, Motion |
| Backend     | Fastify 5, Node 22, streaming SSE             |
| Datos       | PostgreSQL 16 (`app_config`, `chats`)         |
| Infra       | Docker Compose, `restart: unless-stopped`     |

### Endpoints

| Método | Ruta                 | Descripción                                |
| ------ | -------------------- | ------------------------------------------ |
| GET    | `/api/config`        | Configuración actual (key enmascarada)     |
| POST   | `/api/config`        | Guardar configuración                      |
| GET    | `/api/models`        | Descubrir modelos (usa la config o headers `x-luma-base`) |
| POST   | `/api/chat`          | Completar chat con **streaming SSE**       |
| GET    | `/api/chats`         | Listar conversaciones                      |
| POST   | `/api/chats`         | Crear conversación                         |
| GET    | `/api/chats/:id`     | Ver conversación completa                  |
| PUT    | `/api/chats/:id`     | Actualizar conversación                    |
| DELETE | `/api/chats/:id`     | Eliminar conversación                      |
| DELETE | `/api/data`          | Borrar todos los chats                     |

## 🛠️ Desarrollo local

```bash
npm install
# Levanta solo la BD de Postgres (puerto 17016)
docker compose up -d db
DATABASE_URL=postgres://luma:<pass>@localhost:17016/luma npm run dev
```

`npm run dev` inicia el backend (`:3001`) y el frontend Vite (`:5173`, con proxy a `/api`).

## 🔄 Actualizar el despliegue

```bash
git pull --ff-only && docker compose up -d --build
```

---

<div align="center">

Hecho con 💜 para chatear libre con tu LLM local.

</div>
