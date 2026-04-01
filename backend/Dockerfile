FROM oven/bun:1 AS base
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY shared/ shared/
COPY backend/ backend/

# Generate Prisma client
RUN cd backend && bun run db:generate

WORKDIR /app/backend

USER bun

EXPOSE 3000
CMD ["bun", "run", "start:prod"]
