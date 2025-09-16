import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
    const prisma = fastify.prisma;
    if (!prisma) throw new Error("fastify.prisma not available");

    fastify.post("/register", async (req, reply) => {
        const { username, password, email, displayName } = req.body as {
            username: string;
            password: string;
            email: string;
            displayName?: string;
        };

        if (!username || !email || !password) {
            return reply
                .code(400)
                .send({
                    ok: false,
                    error: "username & email & password required",
                });
        }

        const exists = await fastify.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
            select: { id: true },
        });
        if (exists) {
            return reply
                .code(409)
                .send({ ok: false, error: "Email or username already in use" });
        }

        const hash = await argon2.hash(password);

        const defaultRoleName = "user";
        const role = await fastify.prisma.role.upsert({
            where: { name: defaultRoleName },
            update: {},
            create: { name: defaultRoleName },
            select: { id: true },
        });

        const user = await fastify.prisma.user.create({
            data: {
                username,
                password: hash,
                email,
                displayName: displayName ?? "",
                roleId :role.id,
            },
            select: { id: true, email: true, displayName: true },
        });

        return reply.code(201).send({ ok: true, user });
    });
};
