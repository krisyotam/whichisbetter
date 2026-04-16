################################################################################
# Dependencies stage
# - Installs ALL dependencies (dev + prod) for build
################################################################################
FROM node:20-alpine AS deps

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json* ./

RUN npm ci


################################################################################
# Build stage
# - Reuses installed node_modules (includes dev deps for build)
# - Runs production build for Next.js
################################################################################
FROM node:20-alpine AS builder

WORKDIR /app

# Reuse dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Run the production build (emits .next/standalone via output: 'standalone')
RUN npm run build


################################################################################
# Runtime stage
# - Uses Next.js standalone output (~50MB vs full .next + node_modules in GB)
# - Standalone bundles server.js + only the node_modules files actually needed
# - Static assets and public dir must be copied separately
################################################################################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone output: server + bundled dependencies
COPY --from=builder /app/.next/standalone ./

# Static assets (CSS, JS chunks) not included in standalone
COPY --from=builder /app/.next/static ./.next/static

# Public dir (sql.js WASM, images, etc.)
COPY --from=builder /app/public ./public

EXPOSE 3000

# Standalone uses node server.js directly (no npm start needed)
CMD ["node", "server.js"]
