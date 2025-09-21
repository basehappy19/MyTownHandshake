import { randomUUID } from "node:crypto";
import { extname, join, basename, isAbsolute } from "node:path";
import { mkdir, access, unlink, rename } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import "@fastify/multipart";

const insertReportRoute: FastifyPluginAsync = async (fastify) => {
    fastify.post("/report", async (req, reply) => {
        const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
        const UPLOADS_DIR = process.env.UPLOADS_DIR;

        if (!UPLOADS_DIR) {
            throw new Error("UPLOADS_DIR is not configured");
        }

        const UPLOADS_BASE = join(UPLOADS_DIR, "reports");

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

        async function ensureDir(dir: string) {
            try {
                await access(dir, fsConstants.F_OK);
            } catch {
                await mkdir(dir, { recursive: true });
            }
        }

        let tempFilePath: string | undefined;

        try {
            if (!req.isMultipart()) {
                return badRequest(
                    reply,
                    "Content-Type must be multipart/form-data"
                );
            }

            const parts = req.parts();

            let lat: number | undefined;
            let lng: number | undefined;
            let detail: string | undefined;
            let user_agent: string | undefined;
            let device_id: string | undefined;
            let fileReceived = false;
            let uploadedOriginalName = "upload";
            let uploadedMime = "application/octet-stream";

            await ensureDir(UPLOADS_BASE);

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
                                if (val.trim()) user_agent = val.trim();
                                break;
                            case "device_id":
                                if (val.trim()) device_id = val.trim();
                                break;
                        }
                    }
                } catch (partError: any) {
                    if (part.type === "file" && tempFilePath) {
                        try {
                            await unlink(tempFilePath);
                        } catch (rmErr) {
                            
                        }
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
                if (tempFilePath) {
                    try {
                        await unlink(tempFilePath);
                    } catch (rmErr) {
                    }
                }
                return badRequest(
                    reply,
                    `Missing/invalid fields: ${errs.join(", ")}`
                );
            }

            const prisma = fastify.prisma!;
            const tempName = basename(tempFilePath!);

            const created = await prisma.report.create({
                data: {
                    lat: lat!,
                    lng: lng!,
                    detail: detail!,
                    img: "",
                    categoryId: 1,
                    user_agent: user_agent ?? "",
                    device_id: device_id ?? "",
                },
                select: { id: true },
            });

            const reportId = created.id;

            const reportDir = join(UPLOADS_BASE, String(reportId));
            await ensureDir(reportDir);

            const finalFileName = tempName;
            const finalPath = join(reportDir, finalFileName);
            await rename(tempFilePath!, finalPath);
            tempFilePath = undefined;

            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.report.update({
                    where: { id: reportId },
                    data: { img: finalFileName },
                });

                await tx.reportStatusHistory.create({
                    data: {
                        reportId,
                        imgBefore: null,
                        imgAfter: finalFileName,
                        finished: false,
                        fromStatus: null,
                        toStatus: 1,
                        note: "created",
                    },
                });
            });

            return reply.code(201).send({ ok: true, id: reportId });
        } catch (err: any) {

            if (tempFilePath) {
                try {
                    await unlink(tempFilePath);
                } catch (rmErr) {
                }
            }
            return reply.code(500).send({ ok: false, error: "Internal error" });
        }
    });
};

export { insertReportRoute };
