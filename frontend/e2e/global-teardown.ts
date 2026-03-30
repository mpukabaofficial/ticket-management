import pg from "pg";

const TEST_DB_URL =
  "postgresql://postgres:postgres_test@localhost:5434/helpdesk_test";

async function globalTeardown() {
  console.log("[e2e teardown] Cleaning test database...");
  const client = new pg.Client({ connectionString: TEST_DB_URL });
  await client.connect();

  // Truncate all non-system tables
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `);

  if (rows.length > 0) {
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    await client.query(`TRUNCATE ${tables} CASCADE`);
  }

  await client.end();
  console.log("[e2e teardown] Teardown complete.");
}

export default globalTeardown;
