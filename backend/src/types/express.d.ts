import type { Session, User } from "better-auth/types";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    session?: Session;
  }
}
