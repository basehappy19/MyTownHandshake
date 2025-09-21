/*
  Warnings:

  - You are about to drop the column `meta` on the `report_status_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."report_status_history" DROP COLUMN "meta",
ADD COLUMN     "finished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "finished_at" TIMESTAMPTZ,
ADD COLUMN     "img_after" TEXT,
ADD COLUMN     "img_before" TEXT;
