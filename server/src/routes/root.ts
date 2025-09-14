import type { FastifyPluginAsync } from "fastify";
import reportRoutes from "./reports";

const root: FastifyPluginAsync = async (fastify) => {
    fastify.get("/", async (req, reply) => {
        reply.send({ hello: "world" });
    });

    await fastify.register(reportRoutes);
};

export default root;
