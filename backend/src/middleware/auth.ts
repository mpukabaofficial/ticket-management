import * as Sentry from "@sentry/bun";
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.session = session.session;
  req.user = session.user;
  Sentry.setUser({ id: session.user.id, email: session.user.email });
  next();
}

// Higher index = more privileges. ADMIN inherits all lower roles.
const ROLE_HIERARCHY = ["AGENT", "ADMIN"] as const;

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.user as Record<string, unknown>)?.role as string | undefined;

    if (!userRole) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const userLevel = ROLE_HIERARCHY.indexOf(userRole as (typeof ROLE_HIERARCHY)[number]);
    const requiredLevel = Math.min(
      ...roles.map((r) => ROLE_HIERARCHY.indexOf(r as (typeof ROLE_HIERARCHY)[number]))
    );

    if (userLevel < requiredLevel) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
