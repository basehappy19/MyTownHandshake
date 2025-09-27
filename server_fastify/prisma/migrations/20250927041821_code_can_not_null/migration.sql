/*
  Warnings:

  - Made the column `code` on table `reports_problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."reports_problem" ALTER COLUMN "code" SET NOT NULL;
