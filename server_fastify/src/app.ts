import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import type { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import imagesRoutes from "./routes/static/serve";
import "dotenv/config";

export interface AppOptions
    extends FastifyServerOptions,
        Partial<AutoloadPluginOptions> {}

const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
    await fastify.register(AutoLoad, {
        dir: join(__dirname, "plugins"),
        options: opts,
    });

    await fastify.register(imagesRoutes);

    await fastify.register(async (instance) => {
        instance.register(AutoLoad, {
            dir: join(__dirname, "routes"),
            options: opts,
        });
    });

};

export default app;
export { app, options };
