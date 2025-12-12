FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy packages
COPY packages ./packages

# Copy web app
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter @jaslide/shared build

# Build Next.js app
RUN pnpm --filter @jaslide/web build

# Production stage
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

COPY --from=base /app ./

WORKDIR /app/apps/web

EXPOSE 3000

ENV NODE_ENV=production

CMD ["pnpm", "start"]
