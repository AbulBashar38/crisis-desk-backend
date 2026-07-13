# syntax=docker/dockerfile:1.6

# ---- builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# bge-m3 model files are downloaded at runtime, but @xenova/transformers
# expects onnxruntime-node. Pre-install native build deps so the postinstall
# succeeds.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runner
ARG PORT=8080
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${PORT}
EXPOSE ${PORT}

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY prisma ./prisma
COPY prisma.config.ts ./

CMD ["node", "dist/server.js"]