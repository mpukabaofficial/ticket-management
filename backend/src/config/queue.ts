import { PgBoss } from "pg-boss";

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL!,
});

boss.on("error", console.error);

export default boss;
