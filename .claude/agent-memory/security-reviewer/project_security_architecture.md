---
name: Security Architecture Overview
description: Key security configuration facts about this ticket management app found during the first security review (2026-03-29)
type: project
---

Auth stack: Better Auth 1.5.6 with email/password, database sessions via Prisma adapter (PostgreSQL).

**Why this matters for future reviews:** The app is early-stage (auth was the most recent major commit). Most controllers/services are empty stubs — future security reviews should focus heavily on those when they are built.

**Session cookies:** Better Auth sets `httpOnly=true`, `sameSite=lax` by default. `Secure` flag is only set automatically when `BETTER_AUTH_URL` uses `https`. In this codebase `BETTER_AUTH_URL` is `http://localhost:3000` in `.env.example`, so Secure flag will NOT be set unless production environment overrides this. No explicit `useSecureCookies: true` is configured in `auth.ts`.

**Sign-up disablement:** Uses `disabledPaths: ["/sign-up/email"]` — this is the documented mechanism. The seed script calls `auth.api.signUpEmail()` server-side, which bypasses the disabled HTTP path since it is an API call not a request to the HTTP route. This is correct and intentional.

**Role field:** Defined in Better Auth `additionalFields` with `input: false`, meaning clients cannot set the role during sign-up. Role elevation requires direct DB access (seed script calls `prisma.user.update` after sign-up).

**Missing security controls confirmed absent:**
- No Helmet (HTTP security headers)
- No rate limiting on any route or auth endpoint
- No request body size limit beyond Express defaults
- No ADMIN_EMAIL validation (`.env.example` hardcodes `admin@example.com`)

**Credentials in files:**
- `backend/.env` is gitignored (root `.gitignore` covers it) — NOT committed
- `backend/.env.example` committed with `ADMIN_PASSWORD=password321` — weak default
- `docker-compose.yml` committed with `POSTGRES_PASSWORD: postgres` — weak hardcoded credential
- `backend/.env` (local) contains real secret: `BETTER_AUTH_SECRET=XZZtrARCYDOKOGZSMK7ZyQT5lCfNRRUY5A+HqccsaqA=` and `ADMIN_PASSWORD=password321`
- `frontend/.env` is NOT in frontend `.gitignore` (only `*.local` and `dist` etc. are listed) — potential exposure risk if frontend env ever contained secrets

**Docker:** No multi-stage or non-root user in backend Dockerfile. Uses `oven/bun:1` which runs as root by default. No `BETTER_AUTH_SECRET` or `ADMIN_PASSWORD` set in `docker-compose.yml` backend service (they are missing entirely — app will crash at runtime unless injected).

**nginx.conf:** Proxies `/api` to backend but does not set security headers. No rate limiting at nginx layer.

**How to apply:** When reviewing future PRs in this repo, always check: (1) new controllers for missing `requireAuth` or role checks, (2) raw Prisma queries or unvalidated input, (3) whether the Docker secrets gap has been addressed.
