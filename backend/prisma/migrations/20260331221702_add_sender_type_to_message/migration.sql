-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('CUSTOMER', 'AGENT');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "senderType" "SenderType";
UPDATE "Message" SET "senderType" = 'CUSTOMER' WHERE "senderType" IS NULL;
ALTER TABLE "Message" ALTER COLUMN "senderType" SET NOT NULL;
