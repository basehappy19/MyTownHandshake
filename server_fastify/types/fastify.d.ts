import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
        signAccess: (payload: object) => string;
        signRefresh: (payload: object) => string;
        verifyAccess: (req: any, reply: any) => Promise<void>;
        requireRole: (
            roleName: string
        ) => (req: any, reply: any) => Promise<void>;
    }
    interface FastifyRequest {
        user?: any;
    }
}
