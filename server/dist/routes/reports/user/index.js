"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@fastify/multipart");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const promises_2 = require("node:stream/promises");
const node_fs_2 = require("node:fs");
const reportRoutesForUser = async (fastify) => {
    fastify.get("/user/reports", async (req, reply) => {
        const { page = "1", pageSize = "10" } = req.query;
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
        const UPLOADS_DIR = (0, node_path_1.join)(process.cwd(), "uploads", "reports");
        function badRequest(reply, msg) {
            return reply.code(400).send({ ok: false, error: msg });
        }
        function pickExtension(filename, mimetype) {
            const e = filename ? (0, node_path_1.extname)(filename).toLowerCase() : "";
            if (e)
                return e;
            if (mimetype === "image/jpeg")
                return ".jpg";
            if (mimetype === "image/png")
                return ".png";
            if (mimetype === "image/webp")
                return ".webp";
            return ".bin";
        }
        async function ensureUploadsDir() {
            try {
                await (0, promises_1.access)(UPLOADS_DIR, node_fs_1.constants.F_OK);
            }
            catch {
                await (0, promises_1.mkdir)(UPLOADS_DIR, { recursive: true });
            }
        }
        let tempFilePath;
        try {
            if (!req.isMultipart()) {
                return badRequest(reply, "Content-Type must be multipart/form-data");
            }
            const parts = req.parts();
            let lat;
            let lng;
            let detail;
            let user_agent;
            let filename;
            let mimetype;
            let device_id;
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
                            return badRequest(reply, "img must be JPEG, PNG, or WEBP");
                        }
                        mimetype = part.mimetype;
                        filename = part.filename ?? "upload";
                        const ext = pickExtension(filename, mimetype);
                        const storedName = `${(0, node_crypto_1.randomUUID)()}${ext}`;
                        tempFilePath = (0, node_path_1.join)(UPLOADS_DIR, storedName);
                        await ensureUploadsDir();
                        await (0, promises_2.pipeline)(part.file, (0, node_fs_2.createWriteStream)(tempFilePath));
                        fileReceived = true;
                    }
                    else {
                        const val = typeof part.value === "string"
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
                                if (val.trim())
                                    detail = val.trim();
                                break;
                            case "user_agent":
                                if (val.trim())
                                    user_agent = val.trim();
                                break;
                            case "device_id":
                                if (val.trim())
                                    device_id = val.trim();
                                break;
                        }
                    }
                }
                catch (partError) {
                    req.log.error({ err: partError }, "error processing part");
                    if (part.type === "file" && tempFilePath) {
                        try {
                            await (0, promises_1.unlink)(tempFilePath);
                        }
                        catch { }
                    }
                    throw partError;
                }
            }
            const errs = [];
            if (typeof lat !== "number")
                errs.push("lat");
            if (typeof lng !== "number")
                errs.push("lng");
            if (!detail)
                errs.push("detail");
            if (!fileReceived)
                errs.push("img");
            if (errs.length) {
                if (tempFilePath) {
                    try {
                        await (0, promises_1.unlink)(tempFilePath);
                    }
                    catch { }
                }
                return badRequest(reply, `Missing/invalid fields: ${errs.join(", ")}`);
            }
            const prisma = fastify.prisma;
            const storedName = tempFilePath ? (0, node_path_1.basename)(tempFilePath) : "";
            const result = await prisma.$transaction(async (tx) => {
                const report = await tx.report.create({
                    data: {
                        lat: lat,
                        lng: lng,
                        detail: detail,
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
            });
            return reply.code(201).send({ ok: true, id: result });
        }
        catch (err) {
            req.log.error({ err }, "report upload failed");
            if (tempFilePath) {
                try {
                    await (0, promises_1.unlink)(tempFilePath);
                }
                catch { }
            }
            return reply.code(500).send({ ok: false, error: "Internal error" });
        }
    });
};
exports.default = reportRoutesForUser;
