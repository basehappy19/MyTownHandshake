import { FastifyPluginAsync } from "fastify";
import { getFields } from "../../functions/readFormFields";
import { Prisma } from "@prisma/client";

const chooseInstitutionRoute: FastifyPluginAsync = async (fastify) => {
    fastify.put("/admin/choose-institution", async (req, reply) => {
        try {
            const f = await getFields(req);
            req.log.info({ fields: f }, "choose-institution incoming fields");

            const institutionId = String(
                f.institution_id ?? f.institutionId ?? ""
            ).trim();
            const reportId = String(f.report_id ?? f.reportId ?? "").trim();

            if (!institutionId || !reportId) {
                return reply.code(400).send({
                    ok: false,
                    error: "institution_id & report_id required",
                });
            }

            // ถ้า “institution” ของคุณจริง ๆ คือ User (UUID)
            // ใช้ transaction เพื่อความสม่ำเสมอ: อ่าน + อัปเดตใน TX เดียว
            await fastify.prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const user = await tx.user.findUnique({
                        where: { id: institutionId },
                        select: { id: true, display_name: true },
                    });

                    if (!user) {
                        // โยน error แล้วจับด้านนอกเพื่อส่ง 404
                        const e = new Error("user not found");
                        (e as any).statusCode = 404;
                        throw e;
                    }

                    // อัปเดตผู้รับผิดชอบของ report
                    await tx.report.update({
                        where: { id: reportId }, // Report.id เป็น UUID (String)
                        data: { responsible_id: user.id }, // ใช้ชื่อฟิลด์ให้ตรง schema (snake_case)
                    });

                    // ถ้าต้องการบันทึกประวัติการมอบหมายด้วย (เลือกใส่)
                    // await tx.reportStatusHistory.create({
                    //   data: {
                    //     report_id: reportId,
                    //     from_status: null,
                    //     to_status: 1,
                    //     note: `assigned to ${user.displayName ?? user.id}`,
                    //     finished: false,
                    //   },
                    // });
                }
            );

            return reply.send({ ok: true });
        } catch (err: any) {
            // map error -> status ที่เหมาะสม
            const code = err?.statusCode ?? 500;
            req.log.error({ err }, "choose-institution failed");

            if (code === 404) {
                return reply
                    .code(404)
                    .send({ ok: false, error: "user not found" });
            }
            if (err?.code === "P2025") {
                // Prisma record not found (เช่น report ไม่พบ)
                return reply
                    .code(404)
                    .send({ ok: false, error: "report not found" });
            }

            return reply.code(500).send({ ok: false, error: "Server error" });
        }
    });
};

export default chooseInstitutionRoute;
