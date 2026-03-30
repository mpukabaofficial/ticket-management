FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run db:generate

USER bun

EXPOSE 3000
CMD ["bun", "src/server.ts"]
