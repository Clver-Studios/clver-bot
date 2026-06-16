# Step 1: Initialize temporary build environment using Node 22 Alpine
FROM node:22-alpine AS builder
WORKDIR /app

# Step 2: Enable Corepack to utilize native pnpm package management
RUN corepack enable && corepack prepare pnpm@latest --activate

# Step 3: Copy lockfiles and fetch dependencies into virtual store cache
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch

# Step 4: Install cached offline dependencies and compile codebase
COPY tsconfig.json ./
COPY src ./src
RUN pnpm install --offline
RUN pnpm run build

# Step 5: Prune development footprints down to lean runtime needs
RUN pnpm prune --prod

# Step 6: Construct standalone clean runtime container layer
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Step 7: Import compiled logic and runtime components from the builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Step 8: Low-overhead production boot sequence
CMD ["node", "dist/index.js"]