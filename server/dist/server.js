"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function start() {
    const server = (0, fastify_1.default)({
        logger: {
            level: "info",
            transport: {
                target: "pino-pretty",
                options: { colorize: true, translateTime: "SYS:standard" },
            },
        },
    });
    const opts = {};
    await server.register(app_1.default, opts);
    await server.listen({ port: 8000, host: "0.0.0.0" });
}
start().catch((err) => {
    console.error(err);
    process.exit(1);
});
