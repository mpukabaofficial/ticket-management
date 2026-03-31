import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../backend");

const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT) || 3001;
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT) || 5174;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

process.env.E2E_BACKEND_URL = BACKEND_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "bun run --env-file=.env.test src/server.ts",
      cwd: backendDir,
      port: BACKEND_PORT,
      // Always restart the backend for each test run so that Better Auth's
      // in-memory rate-limit counters are cleared between runs.
      reuseExistingServer: false,
      timeout: 15000,
    },
    {
      command: `bun run vite --port ${FRONTEND_PORT}`,
      port: FRONTEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
      env: {
        VITE_API_URL: BACKEND_URL,
      },
    },
  ],
});
