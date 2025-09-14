import fp from "fastify-plugin";

export default fp(async function (fastify) {
    await fastify.register(require("@fastify/multipart"), {
        limits: {
            fileSize: 100 * 1024 * 1024,
            files: 1,
            fields: 10,
        },
    });
});
