import fp from "fastify-plugin";

export default fp(async function (fastify) {
    await fastify.register(require("@fastify/multipart"), {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 1,
            fields: 10,
        },
    });
});
