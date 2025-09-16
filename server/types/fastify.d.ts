import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
    interface FastifyInstance {
        authGuard: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
