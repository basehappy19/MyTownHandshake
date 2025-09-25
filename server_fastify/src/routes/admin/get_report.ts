import { Prisma } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

const getReportRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get("/admin/reports", async (req, reply) => {
        const { device_id } = req.query as { device_id?: string };
        const { page = "1", pageSize = "10" } = req.query as {
            page?: string;
            pageSize?: string;
        };

        const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));

        const where =
            device_id && device_id.trim()
                ? { device_id: device_id.trim() }
                : undefined;

        const [total, reports] = await fastify.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                const total = await tx.report.count({ where });

                const totalPages = Math.ceil(total / ps);
                const rawP = Number(page) || 1;
                const p =
                    totalPages > 0
                        ? Math.min(totalPages, Math.max(1, rawP))
                        : 1;
                const skip = (p - 1) * ps;

                const reports = await tx.report.findMany({
                    where,
                    skip,
                    take: ps,
                    orderBy: { created_at: "desc" },
                    select: {
                        id: true,
                        detail: true,
                        img: true,
                        category: { select: { name: true } },
                        histories: {
                            orderBy: { changed_at: "desc" },
                            select: {
                                from: { select: { label: true } },
                                to: { select: { label: true } },
                                note: true,
                                changed_at: true,
                                img_before: true,
                                img_after: true,
                                finished: true,
                            },
                        },
                        address: true,
                        responsible: { select: { display_name: true } },
                        created_at: true,
                    },
                });

                return [total, reports] as const;
            }
        );

        const totalPages = Math.ceil(total / ps);
        const rawP = Number(page) || 1;
        const p = totalPages > 0 ? Math.min(totalPages, Math.max(1, rawP)) : 1;

        return reply.send({
            ok: true,
            page: p,
            pageSize: ps,
            total,
            totalPages,
            items: reports,
        });
    });
};

export { getReportRoute };
