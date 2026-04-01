FROM oven/bun:1 AS build
WORKDIR /app

# Accept build-time env vars
ARG VITE_API_URL
ARG VITE_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT

# Copy root workspace files
COPY package.json bun.lock* ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY shared/ shared/
COPY frontend/ frontend/

# Build frontend
WORKDIR /app/frontend
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY --from=build /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf.template

ENV PORT=80
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
