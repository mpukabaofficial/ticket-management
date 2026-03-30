import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT!, 10),
  trustedOrigins: process.env.TRUSTED_ORIGINS!.split(",").map((origin) =>
    origin.trim()
  ),
  nodeEnv: process.env.NODE_ENV!,
};
