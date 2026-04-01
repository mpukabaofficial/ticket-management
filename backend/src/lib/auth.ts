import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../config/db";
import { config } from "../config";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: config.trustedOrigins,
  disabledPaths: ["/sign-up/email"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "AGENT",
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: config.nodeEnv === "production",
  },
  advanced: {
    useSecureCookies: config.nodeEnv === "production",
    defaultCookieAttributes: {
      sameSite: config.nodeEnv === "production" ? "none" : "lax",
      secure: config.nodeEnv === "production",
      partitioned: config.nodeEnv === "production",
    },
  },
});
