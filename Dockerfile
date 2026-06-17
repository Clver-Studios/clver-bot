# Step 1: Base runtime layer definition
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Step 2: Dependency isolation layer
FROM base AS dependencies
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch
RUN pnpm install --offline

# Step 3: Application compilation layer
FROM base AS builder
COPY pnpm-lock.yaml package.json ./
COPY --from=dependencies /app/node_modules ./node_modules

# CRITICAL: Copy schema definitions and generate engine types inside the container first
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN pnpm prisma generate

# Copy the rest of the engine source code files
COPY tsconfig.json ./
COPY src ./src/

# Execute the TypeScript compiler safely with hydrated engine models
RUN pnpm run build

# Step 4: Prune development footprints down to lean production needs
FROM base AS runner
ENV NODE_ENV=production
COPY package.json ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# FIXED: Copy the configuration file over to the final container execution layer
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

CMD ["node", "dist/index.js"]