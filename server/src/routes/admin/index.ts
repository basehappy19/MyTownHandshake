import type { FastifyPluginAsync } from "fastify";

const reportRoutesForAdmin: FastifyPluginAsync = async (fastify) => {
    fastify.get(
        "/admin/reports",
        { preHandler: [fastify.authGuard] },
        async (req, reply) => {
            const { page = "1", pageSize = "10" } = req.query as {
                page?: string;
                pageSize?: string;
            };

            const p = Math.max(1, Number(page) || 1);
            const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));
            const skip = (p - 1) * ps;

            const [reports, total] = await fastify.prisma.$transaction([
                fastify.prisma.report.findMany({
                    skip,
                    take: ps,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        lat: true,
                        lng: true,
                        detail: true,
                        img: true,
                        category: { select: { name: true } },
                        histories: {
                            orderBy: { changedAt: "desc" },
                            select: {
                                id: true,
                                from: { select: { label: true } },
                                to: { select: { label: true } },
                                note: true,
                                changedBy: true,
                                changedAt: true,
                            },
                        },
                        createdAt: true,
                    },
                }),
                fastify.prisma.report.count(),
            ]);

            return reply.code(200).send({
                ok: true,
                page: p,
                pageSize: ps,
                total,
                totalPages: Math.ceil(total / ps),
                items: reports,
            });
        }
    );

    fastify.put(
        "/admin/report/:id/status",
        { preHandler: [fastify.authGuard] },
        async (req, reply) => {
            const { id } = req.params as { id: string };
            const { toStatusId, note, changedBy } = req.body as {
                toStatusId: number;
                note?: string;
                changedBy?: string;
            };

            if (!toStatusId || isNaN(Number(toStatusId))) {
                return reply
                    .code(400)
                    .send({ ok: false, error: "toStatusId is required" });
            }

            const result = await fastify.prisma.$transaction(async (tx) => {
                const report = await tx.report.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        histories: {
                            orderBy: { changedAt: "desc" },
                            take: 1,
                            select: { toStatus: true },
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

                const fromStatus = report.histories[0]?.toStatus ?? null;

                await tx.reportStatusHistory.create({
                    data: {
                        reportId: report.id,
                        fromStatus,
                        toStatus: Number(toStatusId),
                        note,
                        changedBy,
                    },
                });

                return { reportId: report.id };
            });

            return reply.code(200).send({ ok: true, ...result });
        }
    );
};

export default reportRoutesForAdmin;
