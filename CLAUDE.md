# Ticket Management System

## Project Overview
AI-powered ticket management system for an online school. See `project-scope.md` for full scope and `tech-stack.md` for stack decisions.

## Tech Stack
- **Backend:** Express 5 + TypeScript (Bun runtime)
- **Frontend:** Vite 8 + React 19 + TypeScript + React Router 7
- **Database:** PostgreSQL + Prisma 7 ORM (with `@prisma/adapter-pg` driver adapter)
- **Auth:** Better Auth with email/password, database sessions
- **Forms:** React Hook Form + Zod (with `@hookform/resolvers`)
- **Deployment:** Docker + Railway

## Project Structure
```
backend/
  src/
    app.ts              — Express app setup (CORS, auth handler, routes)
    server.ts           — Server entry point (DB connect + listen)
    config/             — Environment config (index.ts) + Prisma client (db.ts)
    lib/auth.ts         — Better Auth configuration
    middleware/auth.ts   — Auth middleware for protected routes
    routes/index.ts     — API route definitions
    controllers/        — Route handlers (empty, in progress)
    services/           — Business logic (empty, in progress)
    types/express.d.ts  — Express type augmentation
  prisma/
    schema.prisma       — Database schema (includes Better Auth tables + role field)
    seed.ts             — Seeds admin user via Better Auth API
frontend/
  src/
    pages/              — Login, Dashboard, NotFound
    components/         — PrivateRoute (session guard)
    layouts/            — MainLayout (navbar + sign-out)
    lib/auth-client.ts  — Better Auth client instance
    hooks/              — Custom hooks (empty, in progress)
    services/           — API services (empty, in progress)
docker-compose.yml      — Local dev (Postgres on port 5433, backend, frontend)
```

## Development
- Use `bun` as the package manager and runtime
- Backend runs on port 3000, frontend on port 5173
- `cd backend && bun run dev` — start backend with watch mode
- `cd frontend && bun run dev` — start frontend with HMR
- `cd backend && bun run db:migrate` — run Prisma migrations
- `cd backend && bun run db:generate` — regenerate Prisma client
- `cd backend && bun run db:seed` — seed admin user
- `docker compose up -d` — start Postgres and services

## Key Patterns
- Better Auth handler is mounted **before** `express.json()` in app.ts (required)
- Prisma uses the `@prisma/adapter-pg` driver adapter (not the default Prisma engine)
- Prisma client is generated to `backend/src/generated/prisma/client`
- Frontend forms use React Hook Form with Zod schemas via `zodResolver`
- Invalid form fields get `.input-error` CSS class for red border styling
- Auth sign-up is disabled (`disabledPaths: ["/sign-up/email"]`) — users are created via seed/admin only
- User model has a custom `role` field (default: `AGENT`)

## Environment Variables
- Backend: `PORT`, `TRUSTED_ORIGINS`, `NODE_ENV`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Frontend: `VITE_API_URL` (Better Auth client base URL)
- See `.env.example` files in each directory

## Documentation
- Always use **Context7** MCP server to fetch up-to-date documentation for any library, framework, or tool used in this project before writing code or giving advice. Do not rely solely on training data.
