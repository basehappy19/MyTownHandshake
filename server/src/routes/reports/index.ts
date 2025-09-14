import type { FastifyPluginAsync, FastifyReply } from "fastify";
import "@fastify/multipart";

import { randomUUID } from "node:crypto";
import { extname, join, basename } from "node:path";
import { mkdir, access, unlink } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

import type { Prisma } from "@prisma/client";

const reportRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/reports", async (req, reply) => {
        const reports = await fastify.prisma.report.findMany({
            select: {
                id: true,
                lat: true,
                lng: true,
                detail: true,
                img: true,
                category: {
                    select: {
                        name: true,
                    }
                },
                histories: {
                    orderBy: { changedAt: "desc" },
                    select:{
                        id: true,
                        from: {
                            select: { label: true }
                        },
                        to: {
                            select: { label: true }
                        },
                        note: true,
                        changedBy: true,
                        changedAt: true,
                    }
                },
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return { ok: true, reports };
    });

    fastify.post("/report", async (req, reply) => {
        const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
        const UPLOADS_DIR = join(process.cwd(), "uploads", "reports");

        type Json = Record<string, unknown>;

        function badRequest(reply: FastifyReply, msg: string) {
            return reply.code(400).send({ ok: false, error: msg });
        }

        function pickExtension(filename: string | undefined, mimetype: string) {
            const e = filename ? extname(filename).toLowerCase() : "";
            if (e) return e;
            if (mimetype === "image/jpeg") return ".jpg";
            if (mimetype === "image/png") return ".png";
            if (mimetype === "image/webp") return ".webp";
            return ".bin";
        }

        async function ensureUploadsDir() {
            try {
                await access(UPLOADS_DIR, fsConstants.F_OK);
            } catch {
                await mkdir(UPLOADS_DIR, { recursive: true });
            }
        }
        let tempFilePath: string | undefined;

        try {
            // 1) ตรวจ Content-Type
            if (!req.isMultipart()) {
                return badRequest(
                    reply,
                    "Content-Type must be multipart/form-data"
                );
            }

            // 2) อ่าน multipart: รับ field และไฟล์ชื่อ img
            const parts = req.parts();

            let lat: number | undefined;
            let lng: number | undefined;
            let detail: string | undefined;
            let meta: Json = {};
            let filename: string | undefined;
            let mimetype: string | undefined;
            let fileReceived = false;

            for await (const part of parts) {
                try {
                    if (part.type === "file") {
                        if (part.fieldname !== "img") {
                            part.file.resume();
                            await new Promise((resolve) => {
                                part.file.on("end", resolve);
                                part.file.on("error", resolve);
                            });
                            continue;
                        }

                        if (!ALLOWED_MIME.has(part.mimetype)) {
                            part.file.resume();
                            await new Promise((resolve) => {
                                part.file.on("end", resolve);
                                part.file.on("error", resolve);
                            });
                            return badRequest(
                                reply,
                                "img must be JPEG, PNG, or WEBP"
                            );
                        }

                        mimetype = part.mimetype;
                        filename = part.filename ?? "upload";

                        const ext = pickExtension(filename, mimetype);
                        const storedName = `${randomUUID()}${ext}`;
                        tempFilePath = join(UPLOADS_DIR, storedName);

                        await ensureUploadsDir();

                        await pipeline(
                            part.file,
                            createWriteStream(tempFilePath)
                        );
                        fileReceived = true;
                    } else {
                        const val =
                            typeof part.value === "string"
                                ? part.value
                                : String(part.value ?? "");

                        switch (part.fieldname) {
                            case "lat": {
                                const n = Number(val);
                                if (!Number.isNaN(n) && n >= -90 && n <= 90)
                                    lat = n;
                                break;
                            }
                            case "lng": {
                                const n = Number(val);
                                if (!Number.isNaN(n) && n >= -180 && n <= 180)
                                    lng = n;
                                break;
                            }
                            case "detail":
                                if (val.trim()) detail = val.trim();
                                break;
                            case "meta":
                                try {
                                    meta = JSON.parse(val) as Json;
                                } catch {
                                    return badRequest(
                                        reply,
                                        "meta must be a JSON string"
                                    );
                                }
                                break;
                        }
                    }
                } catch (partError) {
                    req.log.error({ err: partError }, "error processing part");
                    if (part.type === "file" && tempFilePath) {
                        try {
                            await unlink(tempFilePath);
                        } catch {}
                    }
                    throw partError;
                }
            }

            // 3) ตรวจความถูกต้อง
            const errs: string[] = [];
            if (typeof lat !== "number") errs.push("lat");
            if (typeof lng !== "number") errs.push("lng");
            if (!detail) errs.push("detail");
            if (!fileReceived) errs.push("img");

            if (errs.length) {
                if (tempFilePath) {
                    try {
                        await unlink(tempFilePath);
                    } catch {}
                }
                return badRequest(
                    reply,
                    `Missing/invalid fields: ${errs.join(", ")}`
                );
            }

            // 4) ทำงานกับฐานข้อมูลผ่าน Prisma แทน pg
            const prisma = fastify.prisma;

            const storedName = tempFilePath ? basename(tempFilePath) : "";
            // ใช้ทรานแซกชัน: สร้าง report -> หา status เริ่มต้น -> เขียน history
            const result = await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    // 4.1) สร้างรายงาน
                    const report = await tx.report.create({
                        data: {
                            lat: lat!,
                            lng: lng!,
                            detail: detail!,
                            img: storedName,
                            categoryId: 1,
                            meta: (meta ?? {}) as Prisma.InputJsonValue,
                        },
                        select: { id: true },
                    });

                    // 4.2) หา status เริ่มต้น
                    // ถ้าสคีมาของคุณใช้ code = 'receive' (ตามตัวอย่างก่อนหน้า) ให้ใช้ 'receive'
                    // ถ้าเดิมเคยใช้ 'open' ก็เปลี่ยนบรรทัดด้านล่างนี้เป็น 'open' ได้
                    const startCode = "receive";
                    const start = await tx.status.findFirst({
                        where: { code: startCode },
                        select: { id: true },
                    });

                    const toStatusId = start?.id ?? 1;

                    // 4.3) เขียนประวัติสถานะ
                    await tx.reportStatusHistory.create({
                        data: {
                            reportId: report.id,
                            fromStatus: null,
                            toStatus: toStatusId,
                            note: "created",
                        },
                    });

                    return report.id;
                }
            );

            return reply.code(201).send({ ok: true, id: result });
        } catch (err) {
            req.log.error({ err }, "report upload failed");
            if (tempFilePath) {
                try {
                    await unlink(tempFilePath);
                } catch {}
            }
            return reply.code(500).send({ ok: false, error: "Internal error" });
        }
    });
};

export default reportRoutes;
