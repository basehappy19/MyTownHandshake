import type { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises";

function guessContentType(p: string) {
    switch (path.extname(p).toLowerCase()) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".gif":
            return "image/gif";
        case ".webp":
            return "image/webp";
        case ".svg":
            return "image/svg+xml";
        default:
            return "application/octet-stream";
    }
}

export default async function imagesRoutes(fastify: FastifyInstance) {
    fastify.get("/report/:id/image", async (req, reply) => {
        const { id } = req.params as { id: string };
        const r = await fastify.prisma.report.findUnique({
            where: { id },
            select: { img: true },
        });
        if (!r?.img) return reply.code(404).send({ message: "not found" });

        const UPLOADS_DIR =
            process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
        const REPORTS_DIR = path.join(UPLOADS_DIR, "reports");
        const filePath = path.join(REPORTS_DIR, path.basename(r.img));

        try {
            const stat = await fs.promises.stat(filePath);
            reply.header("Content-Type", guessContentType(filePath));
            reply.header("Content-Length", String(stat.size));
            reply.header("Cache-Control", "public, max-age=3600");
            await pipeline(fs.createReadStream(filePath), reply.raw);
        } catch {
            return reply.code(404).send({ message: "File not found" });
        }
    });
}
