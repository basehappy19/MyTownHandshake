import { FastifyPluginAsync } from "fastify";

export const tokenRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get(
        "/me",
        {
            preHandler: (req, reply) => {
                if (!fastify.jwt)
                    return reply
                        .code(501)
                        .send({ ok: false, error: "JWT not configured" });
                try {
                    const token =
                        (req.headers.authorization?.startsWith("Bearer ")
                            ? req.headers.authorization.slice("Bearer ".length)
                            : undefined);

                    if (!token)
                        return reply
                            .code(401)
                            .send({ ok: false, error: "Unauthorized" });

                    (req as any).user = fastify.jwt.verify(token);
                    return;
                } catch {
                    return reply
                        .code(401)
                        .send({ ok: false, error: "Unauthorized" });
                }
            },
        },
        async (req, reply) => {
            const auth = (req as any).user as { sub: string } | undefined;
            if (!auth?.sub)
                return reply
                    .code(401)
                    .send({ ok: false, error: "Unauthorized" });

            const me = await fastify.prisma.user.findUnique({
                where: { id: auth.sub },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    displayName: true,
                    roleId: true,
                },
            });

            return reply.send({ ok: true, user: me });
        }
    );
};
