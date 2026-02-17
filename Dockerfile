FROM node:20-slim AS base

ENV NODE_ENV=production
WORKDIR /app

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate

# -----------------------------------------------------------------------------
# Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Build (backend + frontend)
# -----------------------------------------------------------------------------
FROM deps AS build

WORKDIR /app

COPY . .

# Generate Prisma client and build all apps via Turbo
RUN pnpm build

# -----------------------------------------------------------------------------
# Runtime image for backend API
# -----------------------------------------------------------------------------
FROM node:20-slim AS backend-runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app /app

WORKDIR /app/apps/backend

# Expose NestJS port
EXPOSE 3000

# Note: database migrations should be run by the entrypoint/compose command
CMD ["node", "dist/main.js"]

# -----------------------------------------------------------------------------
# Runtime image for Next.js frontend
# -----------------------------------------------------------------------------
FROM node:20-slim AS web-runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app /app

WORKDIR /app/apps/web

# Next.js production port
EXPOSE 3001

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]

