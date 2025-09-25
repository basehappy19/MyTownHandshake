/*
  Warnings:

  - You are about to drop the column `lat` on the `reports_problem` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `reports_problem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address_id]` on the table `reports_problem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address_id` to the `reports_problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."reports_problem" DROP COLUMN "lat",
DROP COLUMN "lng",
ADD COLUMN     "address_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "public"."ReportAddress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address_full" TEXT,
    "address_country" TEXT,
    "address_state" TEXT,
    "address_county" TEXT,
    "address_city" TEXT,
    "address_town_borough" TEXT,
    "address_village_suburb" TEXT,
    "address_neighbourhood" TEXT,
    "address_any_settlement" TEXT,
    "address_major_streets" TEXT,
    "address_major_and_minor_streets" TEXT,
    "address_building" TEXT,

    CONSTRAINT "ReportAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_problem_address_id_key" ON "public"."reports_problem"("address_id");

-- AddForeignKey
ALTER TABLE "public"."reports_problem" ADD CONSTRAINT "reports_problem_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."ReportAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
