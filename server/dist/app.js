"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.app = void 0;
const node_path_1 = require("node:path");
const autoload_1 = __importDefault(require("@fastify/autoload"));
const serve_1 = __importDefault(require("./routes/static/serve"));
const options = {};
exports.options = options;
const app = async (fastify, opts) => {
    void fastify.register(autoload_1.default, {
        dir: (0, node_path_1.join)(__dirname, "plugins"),
        options: opts,
    });
    await fastify.register(serve_1.default);
    void fastify.register(async (instance) => {
        instance.register(autoload_1.default, {
            dir: (0, node_path_1.join)(__dirname, "routes"),
            options: opts,
        });
    });
};
exports.app = app;
exports.default = app;
