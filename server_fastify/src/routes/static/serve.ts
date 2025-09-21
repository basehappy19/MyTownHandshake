import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
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

const UUID_RE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export default async function imagesRoutes(fastify: FastifyInstance) {
    fastify.get("/report/image/:reportId", async (req, reply) => {
        const { reportId } = req.params as { reportId: string };

        if (!UUID_RE.test(reportId)) {
            return reply
                .code(400)
                .send({ error: "Invalid reportId (must be UUID)" });
        }

        try {
            const r = await fastify.prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    // อ่านเฉพาะฟิลด์ที่ต้องใช้
                    return tx.report.findUnique({
                        where: { id: reportId },
                        select: { img: true },
                    });
                }
            );

            if (!r?.img) {
                return reply
                    .code(404)
                    .send({ message: "Report or image not found" });
            }

            const UPLOADS_DIR =
                process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
            const REPORTS_DIR = path.join(UPLOADS_DIR, "reports");
            const filePath = path.join(
                REPORTS_DIR,
                reportId,
                path.basename(r.img)
            );

            const stat = await fs.promises.stat(filePath).catch(() => null);
            if (!stat) {
                return reply.code(404).send({ message: "File not found" });
            }

            reply.header("Content-Type", guessContentType(filePath));
            reply.header("Content-Length", String(stat.size));
            reply.header("Cache-Control", "public, max-age=3600");

            await pipeline(fs.createReadStream(filePath), reply.raw);
            return;
        } catch (err) {
            req.log.error({ err }, "serve report image failed");
            return reply.code(500).send({ message: "Internal error" });
        }
    });
}
