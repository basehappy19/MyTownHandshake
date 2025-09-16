import { FastifyPluginAsync } from "fastify";

const reportRouteStatisticsForUser: FastifyPluginAsync = async (fastify) => {
    fastify.get("/user/reports/statistics", async (req, reply) => {
        const total = await fastify.prisma.report.count();

        return reply.send({
            ok: true,
            totalReports: total,
        });
    });
};

export { reportRouteStatisticsForUser };
