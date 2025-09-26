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

type SideMode = "before" | "after";

async function sendFile(reply: any, filePath: string) {
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (!stat) return reply.code(404).send({ message: "File not found" });
    reply.header("Content-Type", guessContentType(filePath));
    reply.header("Content-Length", String(stat.size));
    reply.header("Cache-Control", "public, max-age=3600");
    await pipeline(fs.createReadStream(filePath), reply.raw);
}

export default async function imagesRoutes(fastify: FastifyInstance) {
    /**
     * GET /report/:reportId/image
     * Query:
     *  - history_id?: number (id ใน report_status_history)
     *  - side?: 'before' | 'after'
     *
     * กติกา:
     * - ไม่ส่ง history_id -> ส่งรูปหลักของ report
     * - ส่ง history_id:
     *    - มี side -> ต้องมีรูปฝั่งนั้น มิฉะนั้น 404
     *    - ไม่มี side -> ใช้ img_after ถ้ามี; ไม่มีก็ใช้ img_before; ถ้าไม่มีทั้งคู่ 404
     *
     * เส้นทางไฟล์ (กรณีเดียว):
     *   uploads/reports/:reportId/histories/<filename>
     */
    fastify.get("/report/image/:reportId/", async (req, reply) => {
        const { reportId } = req.params as { reportId: string };
        const { history_id, side } = (req.query || {}) as {
            history_id?: string;
            side?: SideMode;
        };

        if (!UUID_RE.test(reportId)) {
            return reply
                .code(400)
                .send({ error: "Invalid reportId (must be UUID)" });
        }

        const sideMode: SideMode | undefined =
            side === "before" || side === "after" ? side : undefined;

        const historyIdInt =
            typeof history_id === "string" && history_id.trim() !== ""
                ? Number(history_id)
                : null;

        if (
            history_id &&
            (historyIdInt === null || Number.isNaN(historyIdInt))
        ) {
            return reply
                .code(400)
                .send({ error: "Invalid history_id (must be integer id)" });
        }

        // โฟลเดอร์ไฟล์
        const UPLOADS_DIR =
            process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
        const REPORTS_DIR = path.join(UPLOADS_DIR, "reports");

        try {
            const fileRel = await fastify.prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    // อ่าน base report
                    const base = await tx.report.findUnique({
                        where: { id: reportId },
                        select: { img: true, id: true },
                    });

                    if (!base) {
                        return null as string | null;
                    }

                    // ไม่ระบุ history_id -> ส่งรูปหลักของ report
                    if (!historyIdInt) {
                        return base.img ?? null;
                    }

                    // ระบุ history_id -> อ่านเฉพาะแถวนั้น
                    const h = await tx.reportStatusHistory.findFirst({
                        where: { id: historyIdInt, report_id: reportId },
                        select: { img_before: true, img_after: true },
                    });

                    if (!h) return null;

                    if (sideMode) {
                        return sideMode === "after"
                            ? h.img_after ?? null
                            : h.img_before ?? null;
                    }

                    return h.img_after ?? h.img_before ?? null;
                }
            );

            if (!fileRel) {
                return reply.code(404).send({ message: "Image not found" });
            }

            // ป้องกัน path traversal และรองรับกรณี img เก็บเป็น "histories/<file>" หรือ "<file>"
            const safeName = path.basename(fileRel);

            // ดึงจากที่เดียว: uploads/reports/:id/histories/<filename>
            const filePath = path.join(
                REPORTS_DIR,
                reportId,
                "histories",
                safeName
            );

            await sendFile(reply, filePath);
            return;
        } catch (err: any) {
            req.log.error({ err }, "serve report image failed");
            return reply.code(500).send({ message: "Internal error" });
        }
    });
}
