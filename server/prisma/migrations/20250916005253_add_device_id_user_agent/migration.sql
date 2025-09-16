/*
  Warnings:

  - You are about to drop the column `meta` on the `reports_problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."reports_problem" DROP COLUMN "meta",
ADD COLUMN     "device_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "user_agent" TEXT NOT NULL DEFAULT '';
