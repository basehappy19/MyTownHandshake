import { Prisma } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

const getStatus: FastifyPluginAsync = async (fastify) => {
    fastify.get("/admin/statuses", async (req, reply) => {
        try {
            const statuses = await fastify.prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    return tx.status.findMany({
                        where: { is_active: true },
                        orderBy: { sort_order: "asc" },
                        select: { id: true, label: true },
                    });
                },
            );

            return { ok: true, statuses };
        } catch (err) {
            req.log.error({ err }, "failed to fetch statuses");
            reply.code(500);
            return { ok: false, error: "INTERNAL_SERVER_ERROR" };
        }
    });
};

export { getStatus };
