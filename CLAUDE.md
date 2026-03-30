# Ticket Management System

## Project Overview
AI-powered ticket management system for an online school. See `project-scope.md` for full scope and `tech-stack.md` for stack decisions.

## Tech Stack
- **Backend:** Express 5 + TypeScript (Bun runtime)
- **Frontend:** Vite 8 + React 19 + TypeScript + React Router 7
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite` plugin) + shadcn/ui (radix-nova style, remixicon)
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
  components.json       — shadcn/ui configuration
  src/
    index.css           — Tailwind imports + shadcn theme variables
    pages/              — Login, Dashboard, NotFound
    components/         — PrivateRoute (session guard)
    components/ui/      — shadcn/ui components (button, etc.)
    layouts/            — MainLayout (navbar + sign-out)
    lib/auth-client.ts  — Better Auth client instance
    lib/utils.ts        — cn() helper (clsx + tailwind-merge)
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

## Authentication

### Better Auth Setup
- **Server config:** `backend/src/lib/auth.ts` — uses `betterAuth()` with `prismaAdapter`
- **Client config:** `frontend/src/lib/auth-client.ts` — `createAuthClient()` from `better-auth/react`
- **Handler route:** `app.all("/api/auth/*splat", toNodeHandler(auth))` — mounted before `express.json()` (required — Better Auth needs raw request body)
- **Sign-up disabled:** `disabledPaths: ["/sign-up/email"]` — users created via seed/admin only

### Session Management
- Database-stored sessions (not JWTs) — tokens are opaque strings in PostgreSQL
- Session includes: `token`, `userId`, `expiresAt`, `ipAddress`, `userAgent`
- Cookies managed automatically by Better Auth (`same-site`, `secure` flags)
- CORS must have `credentials: true` for cookie-based sessions

### Auth Middleware (`backend/src/middleware/auth.ts`)
- `requireAuth()` validates session via `auth.api.getSession()` with `fromNodeHeaders()`
- Returns 401 `{ error: "Unauthorized" }` on failure
- Attaches `req.user` and `req.session` to Express Request (typed in `types/express.d.ts`)

### Auth Flow
1. Frontend calls `authClient.signIn.email()` → `POST /api/auth/*`
2. Server validates credentials, creates session, sets cookie
3. Frontend uses `authClient.useSession()` hook for session state
4. Protected API routes use `requireAuth` middleware → access `req.user`
5. Frontend route guard: `PrivateRoute` component redirects to `/login` if no session

### Roles
- `role` field on User model: `ADMIN` | `AGENT` (default: `AGENT`)
- Role is NOT managed by Better Auth — set via direct Prisma update after user creation
- Seed script creates admin by calling `auth.api.signUpEmail()` then updating role via Prisma
- No role-based authorization middleware yet (ready for RBAC implementation)

## Database Schema
- **Enums:** `Role` (ADMIN, AGENT), `TicketStatus` (OPEN, RESOLVED, CLOSED), `TicketCategory` (GENERAL, TECHNICAL, REFUND)
- **User** — Better Auth managed + custom `role` field; relations to sessions, accounts, tickets, messages
- **Session / Account / Verification** — Better Auth managed tables
- **Ticket** — UUID PK, `status` (default: OPEN), `category`, `senderEmail` (external), optional `assignedToId` → User
- **Message** — UUID PK, `sender` (string, not FK — can be AI/agent/external), optional `userId` → User
- **Cascade deletes:** User→Sessions, User→Accounts, Ticket→Messages
- Prisma client generated to `backend/src/generated/prisma/client` (gitignored, regenerate with `bun run db:generate`)

## API Routes
- `GET /api/health` — public, returns `{ status: "ok" }`
- `GET /api/me` — protected (`requireAuth`), returns `{ user: req.user }`
- `/api/auth/*` — Better Auth endpoints (sign-in, sign-out, session, etc.)

## Key Patterns
- **Middleware order in app.ts:** CORS → Better Auth handler → `express.json()` → routes
- Prisma uses the `@prisma/adapter-pg` driver adapter (not the default Prisma engine)
- Frontend forms use React Hook Form with Zod schemas via `zodResolver`
- **Import alias:** `@/*` maps to `frontend/src/*` (configured in tsconfig + vite.config.ts)
- **Styling:** Use Tailwind utility classes only — no custom CSS classes. Use shadcn semantic color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`, etc.) instead of hardcoded color values (e.g. `bg-gray-500`, `text-red-600`)
- **shadcn components:** Add with `bunx --bun shadcn@latest add <component>` from the frontend directory
- **cn() helper:** Use `cn()` from `@/lib/utils` to merge Tailwind classes conditionally
- Backend uses ES modules (`"type": "module"`) with direct TypeScript execution via Bun (no build step)

## Docker
- **docker-compose.yml:** PostgreSQL 16 Alpine + backend + frontend (Nginx)
- PostgreSQL: user `postgres`, password `postgres`, database `helpdesk`, port 5432
- Frontend Nginx: SPA fallback via `try_files`, API proxy to `http://backend:3000`

## Environment Variables
- Backend: `PORT`, `TRUSTED_ORIGINS` (comma-separated origins), `NODE_ENV`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Frontend: `VITE_API_URL` (Better Auth client base URL, e.g. `http://localhost:3000`)
- See `.env.example` files in each directory

## Documentation
- Always use **Context7** MCP server to fetch up-to-date documentation for any library, framework, or tool used in this project before writing code or giving advice. Do not rely solely on training data.
