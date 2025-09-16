import type { FastifyPluginAsync } from "fastify";
import { reportRouteStatisticsForUser } from "./statistics";
import { getReportRoute } from "./getReport";
import { insertReportRoute } from "./insertReport";

const reportRoutesForUser: FastifyPluginAsync = async (fastify) => {
    
    await fastify.register(getReportRoute);
    await fastify.register(insertReportRoute);
    await fastify.register(reportRouteStatisticsForUser);
};


export default reportRoutesForUser;
