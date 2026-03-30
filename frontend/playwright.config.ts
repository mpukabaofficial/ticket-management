import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../backend");

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
    baseURL: "http://localhost:5174",
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
      port: 3001,
      // Always restart the backend for each test run so that Better Auth's
      // in-memory rate-limit counters are cleared between runs.
      reuseExistingServer: false,
      timeout: 15000,
    },
    {
      command: "bun run vite --port 5174",
      port: 5174,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
      env: {
        VITE_API_URL: "http://localhost:3001",
      },
    },
  ],
});
