import Fastify from "fastify";
import app, { AppOptions } from "./app";
import dotenv from "dotenv";
dotenv.config();

async function start() {
    const server = Fastify({
        logger: {
            transport: {
                target: "pino-pretty",
                options: { colorize: true, translateTime: "SYS:standard" },
            },
        },
    });

    const opts: AppOptions = {};
    await server.register(app, opts);
    await server.listen({ port: 8000, host: "0.0.0.0" });
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});
