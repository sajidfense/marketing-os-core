# =============================================
# Marketing OS - Multi-stage Dockerfile
# =============================================

# ── Stage 1: Build Frontend ──────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# ── Stage 2: Build Backend ───────────────────
FROM node:20-alpine AS backend-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src/ src/
RUN npm run build

# ── Stage 3: Production ─────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --production

# Copy built artifacts
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=frontend-build /app/dist/client ./dist/client

# Copy migrations
COPY supabase/ ./supabase/

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "server/dist/server.js"]
