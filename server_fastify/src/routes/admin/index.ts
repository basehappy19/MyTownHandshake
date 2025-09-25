import type { FastifyPluginAsync } from "fastify";
import chooseInstitutionRoute from "./choose_institution";
import { getReportRoute } from "./get_report";
import { getStatus } from "./get_status";
import { getStatisticsStatuses } from "./get_statistics";

const adminRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(getReportRoute);
    await fastify.register(chooseInstitutionRoute);
    await fastify.register(getStatus)
    await fastify.register(getStatisticsStatuses)
};

export default adminRoutes;
