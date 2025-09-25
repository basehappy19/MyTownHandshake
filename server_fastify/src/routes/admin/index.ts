import type { FastifyPluginAsync } from "fastify";
import chooseInstitutionRoute from "./choose_institution";
import { getStatus } from "./get_status";
import updateStatusRoute from "./update_status";

const adminRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(chooseInstitutionRoute);
    await fastify.register(getStatus)
    await fastify.register(updateStatusRoute)
};

export default adminRoutes;
