const url = process.env.E2E_BACKEND_URL;
if (!url) {
  throw new Error("E2E_BACKEND_URL environment variable is required — set BACKEND_PORT in playwright.config.ts");
}
export const BACKEND_URL = url;
