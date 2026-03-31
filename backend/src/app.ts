import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { config } from "./config";
import { auth } from "./lib/auth";
import routes from "./routes";
import { UserError } from "./services/user.service";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: config.trustedOrigins, credentials: true }));

// Rate limiting
const limiter = ({ max, minutes }: { max: number; minutes: number }) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });

// Rate limiting (production only)
if (config.nodeEnv === "production") {
  app.use("/api/auth", limiter({ max: 20, minutes: 15 }));
  app.use("/api", limiter({ max: 100, minutes: 15 }));
}

// Better Auth handler MUST be before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api", routes);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof UserError) {
      res.status(409).json({ error: err.message });
      return;
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;
