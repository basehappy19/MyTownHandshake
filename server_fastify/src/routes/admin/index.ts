import type { FastifyPluginAsync } from "fastify";
import chooseInstitutionRoute from "./choose_institution";
import { getReportRoute } from "./get_report";
import { getStatus } from "./get_status";

const adminRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(getReportRoute);
    await fastify.register(chooseInstitutionRoute);
    await fastify.register(getStatus)
};

export default adminRoutes;
