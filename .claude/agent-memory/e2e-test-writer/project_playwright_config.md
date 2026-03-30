---
name: Playwright config changes made for E2E tests
description: Required config changes to playwright.config.ts that make the tests work correctly
type: project
---

## Changes made to frontend/playwright.config.ts

### 1. VITE_API_URL env injection
The Vite dev server started by Playwright must serve the frontend with `VITE_API_URL=http://localhost:3001`
(test backend), not the default `http://localhost:3000` (dev backend) from `frontend/.env`.

```ts
{
  command: "bun run vite --port 5174",
  port: 5174,
  reuseExistingServer: !process.env.CI,
  timeout: 15000,
  env: {
    VITE_API_URL: "http://localhost:3001",
  },
},
```

**Why:** `frontend/.env` has `VITE_API_URL=http://localhost:3000`. Without overriding it, all Better Auth
client calls go to the wrong port, causing "Failed to fetch" errors.

### 2. Backend reuseExistingServer: false
The backend is configured with `reuseExistingServer: false` (NOT `!process.env.CI`).

```ts
{
  command: "bun run --env-file=.env.test src/server.ts",
  cwd: backendDir,
  port: 3001,
  reuseExistingServer: false,   // ← changed from !process.env.CI
  timeout: 15000,
},
```

**Why:** Better Auth's in-memory rate-limit counters persist in the server process. If the backend is
reused across test runs, the counters from the previous run (wrong password tests, etc.) accumulate and
cause 429 "Too many requests" errors early in the next run. Forcing a fresh server restart every run
clears the counters.
