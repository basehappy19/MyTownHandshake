import { randomUUID } from "node:crypto";
import { extname, join, basename } from "node:path";
import { mkdir, access, unlink, rename } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream, createReadStream } from "node:fs";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync, FastifyReply } from "fastify";

const insertReportRoute: FastifyPluginAsync = async (fastify) => {
    // helper: ensureDir
    async function ensureDir(dir: string) {
        try {
            await access(dir, fsConstants.F_OK);
        } catch {
            await mkdir(dir, { recursive: true });
        }
    }

    // helper: pickExtension
    function pickExtension(filename: string | undefined, mimetype: string) {
        const e = filename ? extname(filename).toLowerCase() : "";
        if (e) return e;
        if (mimetype === "image/jpeg") return ".jpg";
        if (mimetype === "image/png") return ".png";
        if (mimetype === "image/webp") return ".webp";
        return ".bin";
    }

    // helper: safe move (rename with EXDEV fallback)
    async function safeMove(src: string, dest: string) {
        try {
            await rename(src, dest);
        } catch (e: any) {
            if (e?.code === "EXDEV") {
                await pipeline(createReadStream(src), createWriteStream(dest));
                await unlink(src).catch(() => {});
            } else {
                throw e;
            }
        }
    }

    fastify.post("/report", async (req, reply) => {
        const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
        const UPLOADS_DIR = process.env.UPLOADS_DIR;
        if (!UPLOADS_DIR) throw new Error("UPLOADS_DIR is not configured");
        const UPLOADS_BASE = join(UPLOADS_DIR, "reports");

        function badRequest(r: FastifyReply, msg: string) {
            return r.code(400).send({ ok: false, error: msg });
        }

        let tempFilePath: string | undefined;
        let createdReportId: string | undefined;

        try {
            if (!req.isMultipart()) {
                return badRequest(
                    reply,
                    "Content-Type must be multipart/form-data"
                );
            }

            await ensureDir(UPLOADS_BASE);

            const parts = req.parts();

            let lat: number | undefined;
            let lng: number | undefined;
            let detail: string | undefined;
            let user_agent: string | undefined;
            let device_id: string | undefined;

            let fileReceived = false;
            let uploadedOriginalName = "upload";
            let uploadedMime = "application/octet-stream";

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

                        uploadedOriginalName = part.filename ?? "upload";
                        uploadedMime = part.mimetype;

                        const ext = pickExtension(
                            uploadedOriginalName,
                            uploadedMime
                        );
                        const storedTempName = `${randomUUID()}${ext}`;
                        tempFilePath = join(UPLOADS_BASE, storedTempName);

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
                            case "user_agent":
                            case "userAgent":
                                if (val.trim()) user_agent = val.trim();
                                break;
                            case "device_id":
                            case "deviceId":
                                if (val.trim()) device_id = val.trim();
                                break;
                        }
                    }
                } catch (partError) {
                    if (part.type === "file" && tempFilePath) {
                        await unlink(tempFilePath).catch(() => {});
                    }
                    throw partError;
                }
            }

            const errs: string[] = [];
            if (typeof lat !== "number") errs.push("lat");
            if (typeof lng !== "number") errs.push("lng");
            if (!detail) errs.push("detail");
            if (!fileReceived) errs.push("img");
            if (errs.length) {
                if (tempFilePath) await unlink(tempFilePath).catch(() => {});
                return badRequest(
                    reply,
                    `Missing/invalid fields: ${errs.join(", ")}`
                );
            }

            const prisma = fastify.prisma!;
            const tempName = basename(tempFilePath!);

            // ── TX#1: สร้าง report (ยังไม่ใส่ img) ─────────────────────────────────
            const reportId = await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const created = await tx.report.create({
                        data: {
                            lat: lat!,
                            lng: lng!,
                            detail: detail!,
                            img: "",
                            category_id: 1, // ใช้ชื่อ field ให้ตรง schema ปัจจุบัน (snake_case)
                            user_agent: user_agent ?? "",
                            device_id: device_id ?? "",
                        },
                        select: { id: true },
                    });
                    return created.id; // UUID
                }
            );
            createdReportId = reportId;

            // เตรียมปลายทาง แล้วขยับไฟล์
            const reportDir = join(UPLOADS_BASE, String(reportId));
            await ensureDir(reportDir);

            const finalFileName = tempName;
            const finalPath = join(reportDir, finalFileName);

            await safeMove(tempFilePath!, finalPath);
            tempFilePath = undefined;

            // ── TX#2: อัปเดตรูป + เขียน history ───────────────────────────────────
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.report.update({
                    where: { id: reportId },
                    data: { img: finalFileName },
                });

                await tx.reportStatusHistory.create({
                    data: {
                        report_id: reportId,
                        img_before: null,
                        img_after: finalFileName,
                        finished: false,
                        from_status: null,
                        to_status: 1, // ให้แน่ใจว่ามี status id=1 ในตาราง statuses
                        note: "created",
                    },
                });
            });

            return reply.code(201).send({ ok: true, id: reportId });
        } catch (err) {
            req.log.error({ err }, "insertReportRoute failed");

            // ถ้ายังมี temp file อยู่ ให้ลบทิ้ง
            if (tempFilePath) {
                await unlink(tempFilePath).catch(() => {});
            }

            // (ทางเลือก) ถ้าสร้าง report ไปแล้วแต่ย้ายไฟล์ล้มเหลว → ลบแถวทิ้งเพื่อกันข้อมูลค้าง
            // เปิดใช้ถ้าต้องการ policy แบบ all-or-nothing ระดับแอป
            // try {
            //   if (createdReportId) {
            //     await fastify.prisma.report.delete({ where: { id: createdReportId } });
            //   }
            // } catch {}

            return reply.code(500).send({ ok: false, error: "Internal error" });
        }
    });
};

export { insertReportRoute };
