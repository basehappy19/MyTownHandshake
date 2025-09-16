import type { FastifyPluginAsync } from "fastify";
import reportRoutesForUser from "./user/reports";
import reportRoutesForAdmin from "./admin";

const root: FastifyPluginAsync = async (fastify) => {
    fastify.get("/", async (req, reply) => {
        reply.send({ hello: "world" });
    });

    await fastify.register(reportRoutesForUser);
    await fastify.register(reportRoutesForAdmin);
};

export default root;
