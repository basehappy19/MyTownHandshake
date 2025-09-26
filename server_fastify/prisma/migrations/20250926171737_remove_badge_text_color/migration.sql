/*
  Warnings:

  - You are about to drop the column `badge_text` on the `statuses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."statuses" DROP COLUMN "badge_text";
