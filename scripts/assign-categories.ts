import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/helpdesk",
});

const refundKeywords = ["refund", "charged", "billing", "payment", "duplicate charge", "wrong currency", "promo code", "installment"];
const technicalKeywords = ["cannot access", "not working", "error", "crash", "bug", "broken", "failing", "locked out", "loop", "buffering", "404", "500", "sync", "DRM", "SSO", "SAML", "API", "webhook", "upload", "download", "reset", "proctoring"];

async function run() {
  await client.connect();

  const { rows } = await client.query("SELECT id, subject FROM \"Ticket\"");
  let refund = 0, technical = 0, general = 0;

  for (const row of rows) {
    const subject = row.subject.toLowerCase();
    let category: string;

    if (refundKeywords.some(k => subject.includes(k))) {
      category = "REFUND";
      refund++;
    } else if (technicalKeywords.some(k => subject.toLowerCase().includes(k.toLowerCase()))) {
      category = "TECHNICAL";
      technical++;
    } else {
      category = "GENERAL";
      general++;
    }

    await client.query('UPDATE "Ticket" SET category = $1 WHERE id = $2', [category, row.id]);
  }

  console.log(`Updated ${rows.length} tickets: ${refund} REFUND, ${technical} TECHNICAL, ${general} GENERAL`);
  await client.end();
}

run();
