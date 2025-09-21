import { Prisma } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

const updateStatusRoute: FastifyPluginAsync = async (fastify) => {
    fastify.put<{
        Params: { id: string };
        Body: { toStatusId: number; note?: string; changedBy?: string };
    }>("/admin/report/:id/status", async (req, reply) => {
        const { id } = req.params;
        const { toStatusId, note, changedBy } = req.body;

        if (!toStatusId || isNaN(Number(toStatusId))) {
            return reply
                .code(400)
                .send({ ok: false, error: "toStatusId is required" });
        }

        const result = await fastify.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                const report = await tx.report.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        histories: {
                            orderBy: { changed_at: "desc" },
                            take: 1,
                            select: { to_status: true },
                        },
                    },
                });
                if (!report)
                    throw fastify.httpErrors.notFound("Report not found");

                const newStatus = await tx.status.findUnique({
                    where: { id: Number(toStatusId) },
                });
                if (!newStatus)
                    throw fastify.httpErrors.badRequest("Invalid status id");

                const fromStatus = report.histories[0]?.to_status ?? null;

                await tx.reportStatusHistory.create({
                    data: {
                        report_id: report.id,
                        from_status: fromStatus,
                        to_status: Number(toStatusId),
                        note,
                        changed_by: changedBy ?? null,
                    },
                });

                return { reportId: report.id };
            }
        );

        return reply.code(200).send({ ok: true, ...result });
    });
};

export default updateStatusRoute;