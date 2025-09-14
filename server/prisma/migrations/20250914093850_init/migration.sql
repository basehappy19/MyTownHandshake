-- CreateTable
CREATE TABLE "public"."statuses" (
    "id" SMALLINT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports_problem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "detail" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_status_history" (
    "id" SERIAL NOT NULL,
    "report_id" UUID NOT NULL,
    "from_status" SMALLINT,
    "to_status" SMALLINT NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,
    "note" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "report_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "statuses_code_key" ON "public"."statuses"("code");

-- CreateIndex
CREATE INDEX "idx_rsh_report_id_changed_at" ON "public"."report_status_history"("report_id", "changed_at");

-- AddForeignKey
ALTER TABLE "public"."report_status_history" ADD CONSTRAINT "report_status_history_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports_problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_status_history" ADD CONSTRAINT "report_status_history_from_status_fkey" FOREIGN KEY ("from_status") REFERENCES "public"."statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_status_history" ADD CONSTRAINT "report_status_history_to_status_fkey" FOREIGN KEY ("to_status") REFERENCES "public"."statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
