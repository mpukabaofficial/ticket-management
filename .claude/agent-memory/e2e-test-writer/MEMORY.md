# E2E Test Writer Memory

- [Auth test patterns & selectors](project_auth_test_patterns.md) — selectors, login helper, rate-limiter fix, known constraints
- [Playwright config changes](project_playwright_config.md) — VITE_API_URL env injection, reuseExistingServer: false for backend
- [Better Auth rate limiter behavior](project_better_auth_rate_limiter.md) — in-memory, 3/10s special rule for sign-in, reset on server restart
- [React type=email input constraint](project_email_input_constraint.md) — Chromium blocks non-email values; React re-renders type back, preventing bypass
