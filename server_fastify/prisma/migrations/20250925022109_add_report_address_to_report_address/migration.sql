/*
  Warnings:

  - You are about to drop the `ReportAddress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."reports_problem" DROP CONSTRAINT "reports_problem_address_id_fkey";

-- DropTable
DROP TABLE "public"."ReportAddress";

-- CreateTable
CREATE TABLE "public"."report_address" (
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

    CONSTRAINT "report_address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."reports_problem" ADD CONSTRAINT "reports_problem_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."report_address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
