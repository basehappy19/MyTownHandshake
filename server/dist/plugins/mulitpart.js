"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    await fastify.register(require("@fastify/multipart"), {
        limits: {
            fileSize: 100 * 1024 * 1024,
            files: 1,
            fields: 10,
        },
    });
});
