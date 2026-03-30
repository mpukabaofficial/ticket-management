import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { config } from "./config";
import { auth } from "./lib/auth";
import routes from "./routes";

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));

// Better Auth handler MUST be before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api", routes);

export default app;
