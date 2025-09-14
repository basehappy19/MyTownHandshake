import type { FastifyPluginAsync } from "fastify";
import reportRoutesForUser from "./reports/user";
import reportRoutesForAdmin from "./reports/admin";

const root: FastifyPluginAsync = async (fastify) => {
    fastify.get("/", async (req, reply) => {
        reply.send({ hello: "world" });
    });

    await fastify.register(reportRoutesForUser);
    await fastify.register(reportRoutesForAdmin);
};

export default root;
