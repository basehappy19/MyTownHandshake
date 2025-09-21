import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";

type RegisterBody = {
    username: string;
    email: string;
    password: string;
    displayName?: string;
};

type LoginBody = {
    username_or_email?: string;
    usernameOrEmail?: string;
    password: string;
};

export const authRoutes: FastifyPluginAsync = async (fastify) => {
    // POST /register
    fastify.post("/auth/register", async (req, reply) => {
        const b = req.body as RegisterBody;

        const username = b?.username?.trim();
        const email = b?.email?.trim()?.toLowerCase();
        const password = b?.password;
        const displayName = b?.displayName ?? "";

        if (!username || !email || !password) {
            return reply
                .code(400)
                .send({
                    ok: false,
                    error: "username & email & password required",
                });
        }
        if (password.length < 8) {
            return reply
                .code(400)
                .send({
                    ok: false,
                    error: "password must be at least 8 characters",
                });
        }

        try {
            const exists = await fastify.prisma.user.findFirst({
                where: { OR: [{ email }, { username }] },
                select: { id: true },
            });
            if (exists) {
                return reply
                    .code(409)
                    .send({
                        ok: false,
                        error: "Email or username already in use",
                    });
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
                    displayName,
                    roleId: role.id,
                },
                select: { id: true, email: true, displayName: true },
            });

            return reply.code(201).send({ ok: true, user });
        } catch (err) {
            req.log.error({ err }, "Register error");
            return reply.code(500).send({ ok: false, error: "Server error" });
        }
    });

    // POST /login
    fastify.post("/auth/login", async (req, reply) => {
        const b = req.body as LoginBody;

        const username_or_email =
            b?.username_or_email?.trim() ?? b?.usernameOrEmail?.trim();
        const password = b?.password;

        if (!username_or_email || !password) {
            return reply
                .code(400)
                .send({ ok: false, error: "Invalid credentials" });
        }

        try {
            const user = await fastify.prisma.user.findFirst({
                where: {
                    OR: [
                        { username: username_or_email },
                        { email: username_or_email.toLowerCase() },
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

            req.log.debug(
                { user: user ? { id: user.id, email: user.email } : null },
                "Login attempt"
            );

            let passwordOk = false;
            try {
                if (user?.password) {
                    passwordOk = await argon2.verify(user.password, password);
                } else {
                    // timing-safe dummy verify
                    await argon2
                        .verify(
                            "$argon2id$v=19$m=65536,t=3,p=4$C3VwZXJzZWNyZXRwZXBwZXI$1s2nCqU2JYg6A6H6n4t3E0xwK8eX0b1zYwU3o7l/ivk",
                            password
                        )
                        .catch(() => {});
                }
            } catch {
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

            // ⬇️ JWT เหมือนเดิม
            let token: string | undefined;
            if ((fastify as any).jwt) {
                token = fastify.jwt.sign(payload, { expiresIn: "1h" });
            }

            const { password: _pw, ...safeUser } = user;

            return reply.send({
                ok: true,
                token,
                user: safeUser,
            });
        } catch (err) {
            req.log.error({ err }, "Login error");
            return reply.code(500).send({ ok: false, error: "Server error" });
        }
    });
};

export default authRoutes;
