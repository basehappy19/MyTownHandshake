import { FastifyPluginAsync } from "fastify";

const getReportRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get("/user/reports", async (req, reply) => {
        const { device_id } = req.query as { device_id?: string };
        const { page = "1", pageSize = "10" } = req.query as {
            page?: string;
            pageSize?: string;
        };

        const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));
        const where =
            device_id && device_id.trim()
                ? { device_id: device_id.trim() }
                : {};

        const total = await fastify.prisma.report.count({ where });

        const totalPages = Math.ceil(total / ps);

        const rawP = Number(page) || 1;
        const p = totalPages > 0 ? Math.min(totalPages, Math.max(1, rawP)) : 1;

        const skip = (p - 1) * ps;

        const reports = await fastify.prisma.report.findMany({
            where,
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
        });

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
