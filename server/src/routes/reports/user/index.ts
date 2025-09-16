import type { FastifyPluginAsync, FastifyReply } from "fastify";
import "@fastify/multipart";

import { randomUUID } from "node:crypto";
import { extname, join, basename } from "node:path";
import { mkdir, access, unlink } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

import type { Prisma } from "@prisma/client";

const reportRoutesForUser: FastifyPluginAsync = async (fastify) => {
    fastify.get("/user/reports", async (req, reply) => {
        const { page = "1", pageSize = "10" } = req.query as {
            page?: string;
            pageSize?: string;
        };

        const p = Math.max(1, Number(page) || 1);
        const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));
        const skip = (p - 1) * ps;

        const [reports, total] = await fastify.prisma.$transaction([
            fastify.prisma.report.findMany({
                skip,
                take: ps,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    lat: true,
                    lng: true,
                    detail: true,
                    img: true,
                    category: {
                        select: { name: true },
                    },
                    histories: {
                        orderBy: { changedAt: "desc" },
                        select: {
                            id: true,
                            from: { select: { label: true } },
                            to: { select: { label: true } },
                            note: true,
                            changedBy: true,
                            changedAt: true,
                        },
                    },
                    createdAt: true,
                },
            }),
            fastify.prisma.report.count(),
        ]);

        return reply.send({
            ok: true,
            page: p,
            pageSize: ps,
            total,
            totalPages: Math.ceil(total / ps),
            items: reports,
        });
    });

    fastify.post("/report", async (req, reply) => {
        const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
        const UPLOADS_DIR = join(process.cwd(), "uploads", "reports");

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
            let filename: string | undefined;
            let mimetype: string | undefined;
            let device_id: string | undefined;
            let fileReceived = false;

            req.log.info(
                {
                    got: {
                        lat: typeof lat === "number",
                        lng: typeof lng === "number",
                        detail: Boolean(detail),
                        user_agent: Boolean(user_agent),
                        device_id: Boolean(device_id),
                    },
                },
                "payload summary"
            );
            
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

            const prisma = fastify.prisma;

            const storedName = tempFilePath ? basename(tempFilePath) : "";
            const result = await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const report = await tx.report.create({
                        data: {
                            lat: lat!,
                            lng: lng!,
                            detail: detail!,
                            img: storedName,
                            categoryId: 1,
                            user_agent: user_agent ?? "",
                            device_id: device_id ?? "",
                        },
                        select: { id: true },
                    });

                    await tx.reportStatusHistory.create({
                        data: {
                            reportId: report.id,
                            fromStatus: null,
                            toStatus: 1,
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

export default reportRoutesForUser;
