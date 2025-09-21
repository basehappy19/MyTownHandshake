import type { FastifyPluginAsync } from "fastify";
import reportRoutesForUser from "./user/reports";
import adminRoutes from "./admin";
import authRoutes from "./auth/auth_routes";
import imagesRoutes from "./static/serve";

const root: FastifyPluginAsync = async (fastify) => {
    fastify.get("/", async (req, reply) => {
        reply.send({ hello: "world" });
    });

    await fastify.register(reportRoutesForUser);
    await fastify.register(adminRoutes);
    await fastify.register(authRoutes);
    await fastify.register(imagesRoutes);
};

export default root;
