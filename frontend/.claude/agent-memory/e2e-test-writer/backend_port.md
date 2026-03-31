---
name: Backend port in E2E tests
description: Backend runs on port 3001 (not 3000) during E2E tests — always use the full absolute URL
type: project
---

During E2E test runs, the backend is started on port **3001** (not the dev port 3000). This is configured in `frontend/playwright.config.ts` via the `webServer` array.

The Playwright `baseURL` is `http://localhost:5174` (the frontend). When making direct API calls in tests, always use the full absolute URL:

```
http://localhost:3001/api/tickets/email
http://localhost:3001/api/auth/sign-in/email
```

**How to apply:** Never rely on the `baseURL` shorthand (e.g. `request.post("/api/...")`) for backend calls — it will hit port 5174 instead of 3001.
