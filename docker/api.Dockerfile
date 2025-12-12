FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy packages
COPY packages ./packages

# Copy api app
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm db:generate

# Build shared packages
WORKDIR /app
RUN pnpm --filter @jaslide/shared build

# Build API
RUN pnpm --filter @jaslide/api build

# Production stage
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

COPY --from=base /app ./

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["pnpm", "start:prod"]
