import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../../backend");

const TEST_DB_URL =
  "postgresql://postgres:postgres_test@localhost:5434/helpdesk_test";

const testEnv = {
  ...process.env,
  DATABASE_URL: TEST_DB_URL,
  BETTER_AUTH_SECRET: "test-secret-key-for-e2e-testing-only",
  BETTER_AUTH_URL: "http://localhost:3001",
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD: "password321!",
  PORT: "3001",
  TRUSTED_ORIGINS: "http://localhost:5174",
  NODE_ENV: "test",
};

async function globalSetup() {
  console.log("[e2e setup] Running migrations on test database...");
  execSync("bunx prisma migrate deploy", {
    cwd: backendDir,
    stdio: "inherit",
    env: testEnv,
  });

  console.log("[e2e setup] Generating Prisma client...");
  execSync("bunx prisma generate", {
    cwd: backendDir,
    stdio: "inherit",
    env: testEnv,
  });

  console.log("[e2e setup] Cleaning test database...");
  const client = new pg.Client({ connectionString: TEST_DB_URL });
  await client.connect();
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `);
  if (rows.length > 0) {
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    await client.query(`TRUNCATE ${tables} CASCADE`);
  }
  await client.end();

  console.log("[e2e setup] Seeding test database...");
  execSync("bun run prisma/seed.ts", {
    cwd: backendDir,
    stdio: "inherit",
    env: testEnv,
  });

  console.log("[e2e setup] Setup complete.");
}

export default globalSetup;
