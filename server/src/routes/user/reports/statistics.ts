import type { FastifyPluginAsync } from "fastify";

const reportRouteStatisticsForUser: FastifyPluginAsync = async (fastify) => {
    fastify.get("/user/reports/statistics", async (req, reply) => {
        const categories = await fastify.prisma.category.findMany({
            select: {
                id: true,
                name: true,
                _count: { select: { reports: true } },
            },
            orderBy: { name: "asc" },
        });

        const items = categories.map((c) => ({
            categoryId: c.id,
            name: c.name,
            count: c._count.reports,
        }));

        const totalReports = items.reduce((sum, x) => sum + x.count, 0);

        return reply.send({
            ok: true,
            totalReports,
            byCategory: items,
        });
    });
};

export { reportRouteStatisticsForUser };
