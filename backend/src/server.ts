import { Sentry } from "./config/sentry";
import app from "./app";
import { config } from "./config";
import prisma from "./config/db";
import boss from "./config/queue";
import { CLASSIFY_TICKET_QUEUE, classifyTicketHandler } from "./jobs/classify-ticket";
import { RESOLVE_TICKET_QUEUE, resolveTicketHandler } from "./jobs/resolve-ticket";

process.on("unhandledRejection", (reason) => {
  Sentry.captureException(reason);
});

async function start() {
  await prisma.$connect();
  console.log("Database connected");

  await boss.start();
  await boss.createQueue(CLASSIFY_TICKET_QUEUE);
  await boss.createQueue(RESOLVE_TICKET_QUEUE);
  await boss.work(CLASSIFY_TICKET_QUEUE, classifyTicketHandler);
  await boss.work(RESOLVE_TICKET_QUEUE, resolveTicketHandler);
  console.log("Job queue started");

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start();
