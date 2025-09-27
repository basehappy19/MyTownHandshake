/*
  Warnings:

  - You are about to drop the column `badge_bg` on the `statuses` table. All the data in the column will be lost.
  - You are about to drop the column `badge_ring` on the `statuses` table. All the data in the column will be lost.
  - You are about to drop the column `gradient` on the `statuses` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `statuses` table. All the data in the column will be lost.
  - You are about to drop the column `text_color` on the `statuses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."statuses" DROP COLUMN "badge_bg",
DROP COLUMN "badge_ring",
DROP COLUMN "gradient",
DROP COLUMN "icon",
DROP COLUMN "text_color";
