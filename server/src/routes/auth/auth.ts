import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post("/register", async (req, reply) => {
        const { username, password, email, displayName } = req.body as {
            username: string;
            password: string;
            email: string;
            displayName?: string;
        };

        if (!username || !email || !password) {
            return reply.code(400).send({
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
                roleId: role.id,
            },
            select: { id: true, email: true, displayName: true },
        });

        return reply.code(201).send({ ok: true, user });
    });

    fastify.post("/login", async (req, reply) => {
        const { username_or_email, password } = req.body as {
            username_or_email: string;
            password: string;
        };

        if (!username_or_email || !password) {
            return reply
                .code(400)
                .send({ ok: false, error: "Invalid credentials" });
        }

        const user = await fastify.prisma.user.findFirst({
            where: {
                OR: [
                    { username: username_or_email },
                    { email: username_or_email },
                ],
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                password: true,
                role: true,
            },
        });
        req.log.debug({ user }, "Login attempt");
        let passwordOk = false;
        try {
            if (user?.password) {
                passwordOk = await argon2.verify(user.password, password);
            } else {
                await argon2
                    .verify(
                        "$argon2id$v=19$m=65536,t=3,p=4$C3VwZXJzZWNyZXRwZXBwZXI$1s2nCqU2JYg6A6H6n4t3E0xwK8eX0b1zYwU3o7l/ivk",
                        password
                    )
                    .catch(() => {});
            }
        } catch (_) {
            // ignore
        }

        if (!user || !passwordOk) {
            return reply
                .code(401)
                .send({ ok: false, error: "Invalid credentials" });
        }

        const payload = {
            sub: user.id,
            uname: user.username,
            role: user.role,
        };

        let token: string | undefined;
        if (fastify.jwt) {
            token = fastify.jwt.sign(payload, { expiresIn: "1h" });
        }

        const { password: _pw, ...safeUser } = user;

        return reply.send({
            ok: true,
            token,
            user: safeUser,
        });
    });
};
