"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./reports/user"));
const admin_1 = __importDefault(require("./reports/admin"));
const root = async (fastify) => {
    fastify.get("/", async (req, reply) => {
        reply.send({ hello: "world" });
    });
    await fastify.register(user_1.default);
    await fastify.register(admin_1.default);
};
exports.default = root;
