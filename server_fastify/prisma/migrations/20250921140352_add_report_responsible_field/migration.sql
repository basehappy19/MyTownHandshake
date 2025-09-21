-- AlterTable
ALTER TABLE "public"."reports_problem" ADD COLUMN     "responsible_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."reports_problem" ADD CONSTRAINT "reports_problem_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
