FROM node:20-alpine AS builder
WORKDIR /app

# Install ALL deps (including devDeps — needed for ts-node seed at runtime)
COPY package*.json ./
RUN npm ci

# Copy source and generate Prisma client (--no-engine = Accelerate mode, no binary needed)
COPY . .
RUN npx prisma generate --no-engine

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy everything from builder (node_modules + source + generated Accelerate client)
COPY --from=builder /app .

EXPOSE 3001

# Migrations and seeding are run once externally (locally or in CI).
# Container just starts the broker directly.
CMD ["node", "index.js"]
