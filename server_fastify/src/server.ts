import Fastify from "fastify";
import dotenv from "dotenv";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import app from "./app";
import type { AppOptions } from "./app";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || "refresh-secret";
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "1d";
const isProd = NODE_ENV === "production";

async function start() {
    const server = Fastify({
        logger: isProd
            ? { level: "info" }
            : {
                  level: "debug",
                  transport: {
                      target: "pino-pretty",
                      options: {
                          colorize: true,
                          translateTime: "SYS:standard",
                          ignore: "pid,hostname",
                      },
                  },
              },
    });


    await server.register(fastifyCookie, {
        hook: "onRequest",
        parseOptions: {
            secure: isProd,
            sameSite: "lax",
        },
    });

    await server.register(fastifyJwt, {
        secret: ACCESS_TOKEN_SECRET,
        sign: { expiresIn: JWT_EXPIRES },
    });

    await server.register(fastifyJwt, {
        secret: REFRESH_TOKEN_SECRET,
        namespace: "refreshJwt",
    });

    
    server.decorate("signAccess", (payload: object) =>
        server.jwt.sign(payload, { expiresIn: "15m" })
    );

    server.decorate("signRefresh", (payload: object) =>
        server.refreshJwt.sign(payload, { expiresIn: "7d" })
    );

    server.decorate("verifyAccess", async (req: any, _reply: any) => {
        req.user = await req.jwtVerify();
    });

    server.decorate(
        "requireRole",
        (roleName: string) => async (req: any, reply: any) => {
            await server.verifyAccess(req, reply);
            const role = req.user?.role?.name || req.user?.roleName;
            if (role !== roleName) {
                return reply.code(403).send({ ok: false, error: "Forbidden" });
            }
        }
    );

    const opts: AppOptions = {};
    await server.register(app, opts);
    await server.listen({ port: 8000, host: "0.0.0.0" });
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});

declare module "fastify" {
    interface FastifyInstance {
        signAccess: (payload: object) => string;
        signRefresh: (payload: object) => string;
        verifyAccess: (req: any, reply: any) => Promise<void>;
        requireRole: (
            roleName: string
        ) => (req: any, reply: any) => Promise<void>;
        refreshJwt: {
            sign: (payload: string | object | Buffer, options?: any) => string;
            verify: <T = any>(token: string, options?: any) => T;
            decode: (token: string) => any;
        };
    }
}
