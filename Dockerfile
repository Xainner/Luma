# --- Stage 1: build web (Vite) ---
FROM node:22-alpine AS web-build
WORKDIR /build/web
COPY web/package.json ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

# --- Stage 2: build server (deps + tsc) ---
FROM node:22-alpine AS server-build
WORKDIR /build/server
COPY server/package.json ./
RUN npm install --no-audit --no-fund
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build && npm prune --omit=dev

# --- Stage 3: runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001
COPY --from=server-build /build/server/node_modules ./node_modules
COPY --from=server-build /build/server/dist ./dist
COPY --from=web-build /build/web/dist ./webdist
EXPOSE 3001
CMD ["node", "dist/index.js"]
