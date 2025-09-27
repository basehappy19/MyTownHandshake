// src/routes/report/insertReportRoute.ts
import { randomUUID } from "node:crypto";
import { extname, join, basename } from "node:path";
import { mkdir, access, unlink, rename, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream, createReadStream } from "node:fs";
import { tmpdir } from "node:os"; // <-- ใช้ tmpdir แบบ updateStatusRoute
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { reverseGeocode } from "../../../functions/reverseGeoCode";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// ---------- helpers ----------
async function ensureDir(dir: string) {
    try {
        await access(dir, fsConstants.F_OK);
    } catch {
        await mkdir(dir, { recursive: true });
    }
}

function pickExtension(filename: string | undefined, mimetype: string) {
    const e = filename ? extname(filename).toLowerCase() : "";
    if (e) return e;
    if (mimetype === "image/jpeg") return ".jpg";
    if (mimetype === "image/png") return ".png";
    if (mimetype === "image/webp") return ".webp";
    return ".bin";
}

// safe move (rename with EXDEV fallback)
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

function generateCode(length = 6) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ---------- NEW helpers for naming ----------
function formatDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
}

function slugifyStatusName(name: string) {
    // ปล่อยอักษรไทย/อังกฤษ/ตัวเลข ขีดกลาง/ขีดล่าง, เว้นวรรค -> -
    const normalized = name.normalize("NFKD");
    const replacedSpace = normalized.replace(/\s+/g, "-");
    const cleaned = replacedSpace.replace(/[^0-9A-Za-zก-๙\-_]/g, "");
    return cleaned || "status";
}

async function ensureUniqueFilename(
    dir: string,
    baseName: string,
    ext: string
) {
    // ตรวจซ้ำ: <base><ext>, <base>(1)<ext>, <base>(2)<ext>, ...
    let candidate = `${baseName}${ext}`;
    let i = 1;
    while (true) {
        try {
            await stat(join(dir, candidate));
            candidate = `${baseName}(${i})${ext}`;
            i++;
        } catch {
            return candidate;
        }
    }
}

// ----------------------------------------

const insertReportRoute: FastifyPluginAsync = async (fastify) => {
    fastify.post("/report", async (req, reply) => {
        const UPLOADS_DIR = process.env.UPLOADS_DIR;
        if (!UPLOADS_DIR) throw new Error("UPLOADS_DIR is not configured");

        function badRequest(r: FastifyReply, msg: string) {
            return r.code(400).send({ ok: false, error: msg });
        }

        // temp เก็บไฟล์ที่ OS tmp ก่อน (เหมือน updateStatusRoute)
        let tempFilePath: string | undefined;
        let tempFileMime = "";
        let createdReportId: string | undefined;

        try {
            if (!req.isMultipart()) {
                return badRequest(
                    reply,
                    "Content-Type must be multipart/form-data"
                );
            }

            // ---------- parse multipart ----------
            const parts = req.parts();

            let lat: number | undefined;
            let lng: number | undefined;
            let detail: string | undefined;
            let user_agent: string | undefined;
            let device_id: string | undefined;

            let fileReceived = false;
            let uploadedOriginalName = "upload";

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
                        tempFileMime = part.mimetype;

                        const ext = pickExtension(
                            uploadedOriginalName,
                            tempFileMime
                        );
                        const tmpName = `${randomUUID()}${ext}`;
                        const osTmpBase = join(tmpdir(), "mth-uploads");
                        await ensureDir(osTmpBase);
                        tempFilePath = join(osTmpBase, tmpName);

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
            if (!user_agent) errs.push("detail");
            if (!fileReceived) errs.push("img");
            if (errs.length) {
                if (tempFilePath) await unlink(tempFilePath).catch(() => {});
                return badRequest(
                    reply,
                    `Missing/invalid fields: ${errs.join(", ")}`
                );
            }

            const prisma = fastify.prisma!;

            // Reverse geocode
            let addrPayload: Prisma.ReportAddressUncheckedCreateInput;
            try {
                const g = await reverseGeocode(lat!, lng!);
                addrPayload = {
                    lat: lat!,
                    lng: lng!,
                    address_full: g.address_full,
                    address_country: g.address_country,
                    address_state: g.address_state,
                    address_county: g.address_county,
                    address_city: g.address_city,
                    address_town_borough: g.address_town_borough,
                    address_village_suburb: g.address_village_suburb,
                    address_neighbourhood: g.address_neighbourhood,
                    address_any_settlement: g.address_any_settlement,
                    address_major_streets: g.address_major_streets,
                    address_major_and_minor_streets:
                        g.address_major_and_minor_streets,
                    address_building: g.address_building,
                };
            } catch (e) {
                req.log.warn(
                    { e },
                    "reverseGeocode failed, fallback to minimal address"
                );
                addrPayload = {
                    lat: lat!,
                    lng: lng!,
                    address_full: null,
                    address_country: null,
                    address_state: null,
                    address_county: null,
                    address_city: null,
                    address_town_borough: null,
                    address_village_suburb: null,
                    address_neighbourhood: null,
                    address_any_settlement: null,
                    address_major_streets: null,
                    address_major_and_minor_streets: null,
                    address_building: null,
                };
            }

            // ── TX#1: create address → report (img ว่าง)
            const { reportId, addressId } = await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const address = await tx.reportAddress.create({
                        data: addrPayload,
                        select: { id: true },
                    });

                    let code: string;
                    let exists: boolean;
                    do {
                        code = generateCode();
                        const check = await tx.report.findFirst({
                            where: { code }, 
                            select: { id: true },
                        });
                        exists = !!check;
                    } while (exists);

                    const created = await tx.report.create({
                        data: {
                            detail: detail!,
                            img: "",
                            code,
                            address_id: address.id,
                            category_id: 1,
                            user_agent: user_agent ?? "",
                            device_id: device_id ?? "",
                        },
                        select: { id: true },
                    });

                    return { reportId: created.id, addressId: address.id };
                }
            );

            createdReportId = reportId;

            // ── เตรียมโฟลเดอร์ปลายทางแบบเดียวกับ updateStatusRoute ──
            const baseReportsDir = join(UPLOADS_DIR, "reports");
            const reportDir = join(baseReportsDir, String(reportId));
            const historiesDir = join(reportDir, "histories");
            await ensureDir(baseReportsDir);
            await ensureDir(reportDir);
            await ensureDir(historiesDir);

            // ── ตั้งชื่อไฟล์ ──
            const ext = pickExtension(uploadedOriginalName, tempFileMime);

            // ลำดับ (นับจำนวนรูปใน history ของรายงานนี้)
            const existingCount = await prisma.reportStatusHistory.count({
                where: {
                    report_id: reportId,
                    OR: [
                        { img_before: { not: null } },
                        { img_after: { not: null } },
                    ],
                },
            });
            const orderNo = existingCount + 1;

            // สถานะเริ่มต้น (active + sort_order ต่ำสุด) -> ใช้ code เป็นชื่อ
            const defaultStatus = await prisma.status.findFirst({
                where: { is_active: true },
                orderBy: { sort_order: "asc" },
                select: { id: true, code: true },
            });
            if (!defaultStatus) {
                throw new Error("ไม่พบสถานะเริ่มต้นในฐานข้อมูล");
            }
            const statusId = defaultStatus.id;
            const statusSlug = slugifyStatusName(defaultStatus.code);

            const today = formatDDMMYYYY(new Date());
            const baseNameForUnique = `${orderNo}_${statusSlug}_${today}`;
            const finalFileName = await ensureUniqueFilename(
                historiesDir,
                baseNameForUnique,
                ext
            );
            const finalPathInHistories = join(historiesDir, finalFileName);

            // ── ย้ายไฟล์จาก OS tmp → histories (ที่เดียว) ──
            await safeMove(tempFilePath!, finalPathInHistories);
            tempFilePath = undefined;

            // ── TX#2: อัปเดต report.img ให้ชี้ไปที่ histories/<file> + สร้าง history ──
            const relativeImgPath = join("histories", finalFileName); // <- ไม่มีไฟล์ซ้ำที่รากแล้ว
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.report.update({
                    where: { id: reportId },
                    data: { img: relativeImgPath },
                });

                await tx.reportStatusHistory.create({
                    data: {
                        report_id: reportId,
                        img_before: null,
                        img_after: finalFileName, // เก็บเฉพาะชื่อไฟล์เหมือน updateStatusRoute
                        finished: false,
                        from_status: null,
                        to_status: statusId,
                        note: "created",
                    },
                });
            });

            return reply.code(201).send({
                ok: true,
                id: reportId,
            });
        } catch (err) {
            req.log.error({ err }, "insertReportRoute failed");
            if (tempFilePath) {
                await unlink(tempFilePath).catch(() => {});
            }
            return reply.code(500).send({ ok: false, error: "Internal error" });
        }
    });
};

export { insertReportRoute };
