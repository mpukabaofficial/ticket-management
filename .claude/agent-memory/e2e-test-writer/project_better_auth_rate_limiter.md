---
name: Better Auth rate limiter behavior in test environment
description: How the rate limiter fires during tests and why reuseExistingServer: false is the fix
type: project
---

## Better Auth internal rate limiter

Source: `backend/node_modules/better-auth/dist/api/rate-limiter/index.mjs`

Special rule for `/sign-in/*` (and `/sign-up/*`, `/change-password/*`):
- **window:** 10 seconds
- **max:** 3 requests per IP per window
- Storage: **in-memory** (default when no secondary storage configured)

## Configuration in this project

`backend/src/lib/auth.ts`:
```ts
rateLimit: {
  enabled: config.nodeEnv === "production",
}
```

`config.nodeEnv` is `"test"` during E2E tests, so `enabled: false`. The Better Auth check
`if (!ctx.rateLimit.enabled) return;` should skip rate limiting entirely.

## Why tests were still hitting rate limits

Better Auth rate limit counters are **stored in memory** in the server process. With
`reuseExistingServer: !process.env.CI` (old config), the backend was reused between test runs.
After the first run (which included wrong-password tests), the in-memory counter for
`localhost:sign-in/email` was already at 2-3. The second run immediately hit the limit.

## Fix

Set `reuseExistingServer: false` in `playwright.config.ts` for the backend webServer entry.
This forces a fresh backend restart for every test run, clearing the in-memory counters.
