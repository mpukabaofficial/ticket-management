import app from "./app";
import { config } from "./config";
import prisma from "./config/db";

async function start() {
  await prisma.$connect();
  console.log("Database connected");

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start();
