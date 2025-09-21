import type { FastifyPluginAsync } from "fastify";
import chooseInstitutionRoute from "./choose_institution";
import { getReportRoute } from "./get_report";

const adminRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(getReportRoute);
    await fastify.register(chooseInstitutionRoute);
};

export default adminRoutes;
