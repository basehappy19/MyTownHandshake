import fp from "fastify-plugin";
import multipart from "@fastify/multipart";

export default fp(
    async function multipartPlugin(fastify) {
        await fastify.register(multipart, {
            limits: {
                fields: 100,
                files: 5,
                fileSize: 5 * 1024 * 1024 * 10, 
                fieldSize: 1024 * 1024,
            },
        });
    },
    {
        name: "multipart-plugin",
    }
);
