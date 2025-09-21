import fp from "fastify-plugin";
import multipart from "@fastify/multipart";

export default fp(
    async function multipartPlugin(fastify) {
        await fastify.register(multipart, {
            attachFieldsToBody: true,
            limits: { fields: 100, files: 0, fieldSize: 1024 * 1024 },
        });
    },
    {
        name: "multipart-plugin",
    }
);
