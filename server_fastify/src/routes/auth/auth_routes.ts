import type { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import argon2 from "argon2";
import { getFields } from "../../functions/readFormFields";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
    // POST /auth/register
    fastify.post("/auth/register", async (req, reply) => {
        try {
            const f = await getFields(req);
            req.log.info({ f }, "register incoming fields");

            const username = f.username?.trim();
            const email = f.email?.trim()?.toLowerCase();
            const password = f.password;
            const displayName = f.displayName?.trim() ?? "";

            if (!username || !email || !password) {
                return reply.code(400).send({
                    ok: false,
                    error: "username & email & password required",
                });
            }
            if (password.length < 8) {
                return reply.code(400).send({
                    ok: false,
                    error: "password must be at least 8 characters",
                });
            }

            // ตรวจซ้ำก่อน (นอก TX เพื่อตอบ 409 สวย ๆ)
            const exists = await fastify.prisma.user.findFirst({
                where: { OR: [{ email }, { username }] },
                select: { id: true },
            });
            if (exists) {
                return reply.code(409).send({
                    ok: false,
                    error: "Email or username already in use",
                });
            }

            const hash = await argon2.hash(password);

            // 🔒 ใช้ TransactionClient: upsert role + create user ใน TX เดียว
            const user = await fastify.prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const defaultRoleName = "user";
                    const role = await tx.role.upsert({
                        where: { name: defaultRoleName },
                        update: {},
                        create: { name: defaultRoleName },
                        select: { id: true },
                    });

                    // NOTE: ใช้ชื่อฟิลด์ให้ตรงสคีมาปัจจุบันของคุณ
                    // จาก schema: User มี role_id (snake_case)
                    const created = await tx.user.create({
                        data: {
                            username,
                            password: hash,
                            email,
                            display_name: displayName,
                            role_id: role.id,
                        },
                        select: { id: true, email: true, display_name: true },
                    });

                    return created;
                }
            );

            return reply.code(201).send({ ok: true, user });
        } catch (err) {
            req.log.error({ err }, "Register error");
            // ถ้าเจอ unique constraint (กันเผื่อ race)
            if ((err as any)?.code === "P2002") {
                return reply
                    .code(409)
                    .send({
                        ok: false,
                        error: "Email or username already in use",
                    });
            }
            return reply.code(500).send({ ok: false, error: "Server error" });
        }
    });

    // POST /auth/login
    fastify.post("/auth/login", async (req, reply) => {
        try {
            const f = await getFields(req);
            req.log.info({ f }, "login incoming fields");

            const usernameOrEmail = (
                f.username_or_email ?? f.usernameOrEmail
            )?.trim();
            const password = f.password;

            if (!usernameOrEmail || !password) {
                return reply
                    .code(400)
                    .send({ ok: false, error: "Invalid credentials" });
            }

            // ไม่จำเป็นต้องทำใน TX (อ่านอย่างเดียว)
            const user = await fastify.prisma.user.findFirst({
                where: {
                    OR: [
                        { username: usernameOrEmail },
                        { email: usernameOrEmail.toLowerCase() },
                    ],
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    displayName: true,
                    password: true,
                    role: true, // include relation object (ตามที่คุณใช้)
                },
            });

            let passwordOk = false;
            if (user?.password) {
                passwordOk = await argon2.verify(user.password, password);
            } else {
                // timing-safe dummy
                await argon2
                    .verify(
                        "$argon2id$v=19$m=65536,t=3,p=4$C3VwZXJzZWNyZXRwZXBwZXI$1s2nCqU2JYg6A6H6n4t3E0xwK8eX0b1zYwU3o7l/ivk",
                        password
                    )
                    .catch(() => {});
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
            if ((fastify as any).jwt) {
                token = fastify.jwt.sign(payload, { expiresIn: "1h" });
            }

            const { password: _pw, ...safeUser } = user;
            return reply.send({ ok: true, token, user: safeUser });
        } catch (err) {
            req.log.error({ err }, "Login error");
            return reply.code(500).send({ ok: false, error: "Server error" });
        }
    });
};

export default authRoutes;
