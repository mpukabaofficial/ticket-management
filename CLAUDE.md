# Ticket Management System

## Project Overview
AI-powered ticket management system for an online school. See `project-scope.md` for full scope and `tech-stack.md` for stack decisions.

## Tech Stack
- **Backend:** Express 5 + TypeScript (Bun runtime)
- **Frontend:** Vite 8 + React 19 + TypeScript + React Router 7
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite` plugin) + shadcn/ui (radix-nova style, remixicon)
- **Database:** PostgreSQL + Prisma 7 ORM (with `@prisma/adapter-pg` driver adapter)
- **Auth:** Better Auth with email/password, database sessions
- **Data Fetching:** Axios + TanStack React Query (QueryClientProvider in main.tsx)
- **Validation:** Zod 4 — shared schemas in `shared` package, imports use `zod/v4`
- **Monorepo:** Bun workspaces (`backend`, `frontend`, `shared`)
- **Forms:** React Hook Form + Zod (with `@hookform/resolvers`)
- **Testing:** Vitest + React Testing Library (component), Playwright (E2E)
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
    routes/user.routes.ts   — User CRUD endpoints
    routes/ticket.routes.ts — Ticket endpoints (email intake, list, replies)
    controllers/        — Route handlers (user.controller.ts, ticket.controller.ts)
    services/           — Business logic (user.service.ts, ticket.service.ts)
    utils/validate.ts   — Shared Zod validation + `parseIntParam()` helper for controllers
    types/express.d.ts  — Express type augmentation
  prisma/
    schema.prisma       — Database schema (includes Better Auth tables + role field)
    seed.ts             — Seeds admin user via Better Auth API
frontend/
  playwright.config.ts  — Playwright E2E test configuration
  e2e/
    global-setup.ts     — Migrate + seed test database before tests
    global-teardown.ts  — Truncate test database after tests
  components.json       — shadcn/ui configuration
  src/
    index.css           — Tailwind imports + shadcn theme variables
    pages/              — Login, Dashboard, Users, Tickets, TicketDetail, NotFound
    components/         — PrivateRoute, AdminRoute, UsersTable, UserFormDialog, ErrorAlert
    components/ui/      — shadcn/ui components (alert, alert-dialog, badge, button, card, checkbox, dialog, field, input, label, separator, skeleton, sonner, table, textarea)
    layouts/            — MainLayout (navbar + sign-out)
    lib/auth-client.ts  — Better Auth client instance
    lib/utils.ts        — cn() helper (clsx + tailwind-merge)
    hooks/              — Custom hooks
    services/           — API services
shared/
  src/
    index.ts            — Package entry point (re-exports all schemas, enums, types)
    schemas/            — Zod validation schemas (user.ts, ticket.ts)
    constants/          — Shared enums (role.ts, ticket.ts)
docker-compose.yml      — Docker services (dev Postgres, test Postgres, backend, frontend)
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
- `docker compose up -d postgres-test` — start test database only
- **Component tests:** Vitest + React Testing Library + jsdom (config: `frontend/vitest.config.ts`, setup: `frontend/src/test/setup.ts`)
- `cd frontend && bun run test` — run component tests (single run)
- `cd frontend && bun run test:watch` — run component tests in watch mode
- **Always write unit tests** for new features and components unless explicitly told not to
- Component test files live next to their source: `Component.test.tsx` alongside `Component.tsx`
- Mock axios with `vi.mock("axios")`, wrap components in `QueryClientProvider` with `retry: false`
- **E2E tests:** Always use the `e2e-test-writer` agent to write Playwright tests — do not write E2E tests directly
- **E2E vs unit test boundary:** E2E tests should only cover behaviour that requires a running backend and database (e.g., ticket creation happy path, duplicate detection across requests, auth flows). Schema/validation logic (trimming, max length, missing fields, invalid input) must be covered by unit tests instead — do not duplicate these in E2E.
- **E2E backend URL:** Use `BACKEND_URL` from `frontend/e2e/constants.ts` — never hardcode `localhost:3001` in test files. The port is configured in `playwright.config.ts` via `BACKEND_PORT`.
- **When to run tests:** Only run tests when (1) new tests are created, or (2) a large change warrants verifying nothing broke. Do not run tests after every small change.
- `cd frontend && bun run test:e2e` — run Playwright E2E tests
- `cd frontend && bun run test:e2e:ui` — run E2E tests with Playwright UI
- `bun run build` — full build pipeline (tests → typecheck → lint → build)
- `bun run typecheck` — type-check backend and frontend
- `bun run lint` — lint frontend

## Authentication

### Better Auth Setup
- **Server config:** `backend/src/lib/auth.ts` — uses `betterAuth()` with `prismaAdapter`
- **Client config:** `frontend/src/lib/auth-client.ts` — `createAuthClient()` from `better-auth/react` with `inferAdditionalFields` plugin for typed `role` field
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
5. Frontend route guard: `PrivateRoute` redirects to `/login` if no session; `AdminRoute` redirects to `/` if not ADMIN

### Roles
- `role` field on User model: `ADMIN` | `AGENT` (default: `AGENT`)
- Role is NOT managed by Better Auth — set via direct Prisma update after user creation
- Seed script creates admin by calling `auth.api.signUpEmail()` then updating role via Prisma
- **Frontend route guards:** `PrivateRoute` (any authenticated user) and `AdminRoute` (ADMIN role only) — both show loading spinner while session loads
- **Navbar:** Tickets link visible to all authenticated users; Users link admin-only — use `Role` enum from `shared`, not magic strings

### Frontend Routes
```
/login          → Login (public)
/               → Dashboard (authenticated)
/tickets        → Tickets (authenticated)
/tickets/:id    → TicketDetail (authenticated)
/users          → Users (admin only)
*               → NotFound (authenticated)
```

## Database Schema
- **Enums:** `Role` (ADMIN, AGENT), `TicketStatus` (OPEN, RESOLVED, CLOSED), `TicketCategory` (GENERAL, TECHNICAL, REFUND), `SenderType` (CUSTOMER, AGENT)
- **User** — Better Auth managed + custom `role` field + `deletedAt` (soft delete); relations to sessions, accounts, tickets, messages
- **Session / Account / Verification** — Better Auth managed tables
- **Ticket** — Auto-increment Int PK, `status` (default: OPEN), `category` (optional), `senderEmail` + `senderName` (external), optional `assignedToId` → User
- **Message** — UUID PK, `sender` (string, not FK — can be AI/agent/external), `senderType` (CUSTOMER or AGENT), `ticketId` (Int), optional `userId` → User
- **Cascade deletes:** User→Sessions, User→Accounts, Ticket→Messages
- **Soft delete:** Users have `deletedAt DateTime?` — soft-deleted users have sessions revoked
- Prisma client generated to `backend/src/generated/prisma/client` (gitignored, regenerate with `bun run db:generate`)

## API Routes
- `GET /api/health` — public, returns `{ status: "ok" }`
- `GET /api/me` — protected (`requireAuth`), returns `{ user: req.user }`
- `GET /api/users` — admin only, returns `{ users }`
- `POST /api/users` — admin only, create user (validates with `createUserSchema`)
- `PUT /api/users/:id` — admin only, update user (validates with `editUserSchema`)
- `DELETE /api/users/:id` — admin only, soft-delete user (revokes sessions)
- `GET /api/tickets` — protected (any authenticated user), returns `{ tickets }`
- `GET /api/tickets/:id` — protected, returns `{ ticket }` with messages
- `PATCH /api/tickets/:id` — protected, update ticket status/category
- `PATCH /api/tickets/:id/assign` — protected, assign ticket to agent
- `POST /api/tickets/:id/messages` — protected, add agent reply to ticket
- `POST /api/tickets/email` — **public** (no auth — webhook endpoint), creates ticket or threads reply onto existing open ticket by matching sender email + subject
- `/api/auth/*` — Better Auth endpoints (sign-in, sign-out, session, etc.)

## Key Patterns
- **Middleware order in app.ts:** CORS → Helmet → Better Auth handler → `express.json()` → rate limiter → routes → global error handler
- **Global error handler:** Express 5 auto-forwards async errors to the error handler in `app.ts` — do NOT add try/catch in controllers. Handle domain errors (e.g. `UserError`) in the global error handler, not in individual controllers.
- **Security:** Helmet for HTTP security headers, express-rate-limit for API rate limiting
- **Backend architecture:** Controller + service pattern — controllers handle HTTP req/res, services handle Prisma queries
- **Shared Zod schemas:** Define all Zod validation schemas in the `shared` package (`shared/src/schemas/`), import from `"shared"` in both backend and frontend. Use `zod/v4` for imports in schema files. Export all schemas through `shared/src/index.ts`.
- **Zod v4 format validators:** Use `z.email()`, `z.url()`, `z.uuid()`, `z.iso.datetime()` etc. as top-level constructors — NOT `.email()`, `.url()` string methods, which are deprecated in Zod v4.
- **Shared enums/constants:** Use enums from `shared/src/constants/` (imported via `"shared"`) instead of magic strings. Examples: `Role.ADMIN`, `TicketStatus.OPEN`, `SenderType.AGENT`. Define all shared enums in `shared/src/constants/`.
- Prisma uses the `@prisma/adapter-pg` driver adapter (not the default Prisma engine)
- **Forms:** React Hook Form + Zod via `zodResolver`, using shadcn `Controller` + `Field` + `FieldLabel` + `Input` + `FieldError` pattern (see Login.tsx for reference)
- **Import alias:** `@/*` maps to `frontend/src/*` (configured in tsconfig + vite.config.ts)
- **Styling:** Use Tailwind utility classes only — no custom CSS classes. Use shadcn semantic color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`, etc.) instead of hardcoded color values (e.g. `bg-gray-500`, `text-red-600`)
- **shadcn components:** Add with `bunx --bun shadcn@latest add <component>` from the frontend directory
- **cn() helper:** Use `cn()` from `@/lib/utils` to merge Tailwind classes conditionally
- **Icons:** Use `@remixicon/react` (e.g. `RiLoaderLine` for spinners). Configured as shadcn icon library.
- **Error alerts:** Use `<ErrorAlert message={msg} className="mb-6" />` from `@/components/ErrorAlert` — do not inline `<Alert variant="destructive">` manually
- **Toasts:** `<Toaster />` from sonner is mounted in App.tsx — use `toast()` from `sonner` for notifications
- **Loading states:** Use `<RiLoaderLine className="animate-spin" />` for spinners, `<Skeleton />` for content placeholders
- **Always use shadcn components** (Button, Input, Card, Alert, Badge, Field, etc.) instead of raw HTML elements
- **Data fetching:** Always use Axios for HTTP requests + TanStack React Query (`useQuery`/`useMutation`) for state management — never use raw `fetch` or manual `useState`/`useEffect` for API calls
- **Route param parsing:** Use `parseIntParam(req.params.id, res, "ticket ID")` from `utils/validate.ts` to validate integer route params — rejects NaN, decimals, and values < 1
- Backend uses ES modules (`"type": "module"`) with direct TypeScript execution via Bun (no build step)

## Docker
- **docker-compose.yml:** PostgreSQL 16 Alpine (dev + test) + backend + frontend (Nginx)
- Dev PostgreSQL: user `postgres`, password via `POSTGRES_PASSWORD` env var, database `helpdesk`
- Test PostgreSQL (`postgres-test`): user `postgres`, password `postgres_test`, database `helpdesk_test`, port **5434**
- Frontend Nginx: SPA fallback via `try_files`, API proxy to `http://backend:3000`

## Environment Variables
- Backend: `PORT`, `TRUSTED_ORIGINS` (comma-separated origins), `NODE_ENV`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Frontend: `VITE_API_URL` (Better Auth client base URL, e.g. `http://localhost:3000`)
- See `.env.example` files in each directory

## Documentation
- Always use **Context7** MCP server to fetch up-to-date documentation for any library, framework, or tool used in this project before writing code or giving advice. Do not rely solely on training data.
