import type { FastifyPluginAsync } from "fastify";

const reportRouteStatisticsForUser: FastifyPluginAsync = async (fastify) => {
    fastify.get("/user/reports/statistics", async (req, reply) => {});
};

export { reportRouteStatisticsForUser };
