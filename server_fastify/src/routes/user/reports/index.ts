import type { FastifyPluginAsync } from "fastify";
import { getReportRoute } from "./get_report";
import { insertReportRoute } from "./insert_report";
import { getStatisticsStatuses } from "./get_statistics";

const reportRoutesForUser: FastifyPluginAsync = async (fastify) => {
    await fastify.register(getReportRoute);
    await fastify.register(insertReportRoute);
    await fastify.register(getStatisticsStatuses)
};


export default reportRoutesForUser;
