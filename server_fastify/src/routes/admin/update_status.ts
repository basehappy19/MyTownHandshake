// src/routes/admin/updateStatusRoute.ts
import { randomUUID } from "node:crypto";
import { join, extname } from "node:path";
import { access, mkdir, rename, unlink, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream, createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync, FastifyReply } from "fastify";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// ---------- helpers ----------
async function ensureDir(dir: string) {
    try {
        await access(dir, fsConstants.F_OK);
    } catch {
        await mkdir(dir, { recursive: true });
    }
}

function pickExt(filename: string | undefined, mimetype: string) {
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

// ---------- NEW helpers for naming ----------
function formatDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
}

function slugifyStatusName(name: string) {
    // ปล่อยอักษรไทย/อังกฤษ/ตัวเลข ขีดกลาง/ล่าง, เว้นวรรค -> -
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
    // ตรวจสอบซ้ำ: <base><ext>, <base>(1)<ext>, <base>(2)<ext>, ...
    let candidate = `${baseName}${ext}`;
    let i = 1;
    while (true) {
        try {
            await stat(join(dir, candidate));
            candidate = `${baseName}(${i})${ext}`;
            i++;
        } catch {
            return candidate; // ไม่พบไฟล์ -> ใช้ได้
        }
    }
}

// ---------- route ----------
type BodyJson = {
    to_status_id: number;
    note?: string;
    changed_by?: string;
    finished?: boolean;
};

const updateStatusRoute: FastifyPluginAsync = async (fastify) => {
    fastify.put<{ Params: { id: string } }>(
        "/admin/report/status/:id",
        async (req, reply) => {
            const { id } = req.params;
            const prisma = fastify.prisma!;
            const UPLOADS_DIR = process.env.UPLOADS_DIR;
            if (!UPLOADS_DIR) throw new Error("UPLOADS_DIR is not configured");

            function badRequest(r: FastifyReply, msg: string) {
                return r.code(400).send({ ok: false, error: msg });
            }

            // ---------- parse input (JSON or multipart) ----------
            let to_status_id: number | undefined;
            let note: string | undefined;
            let changed_by: string | undefined;
            let finished: boolean | undefined;

            // temp ไฟล์ไปไว้ที่ OS tmpdir() เพื่อไม่แตะ UPLOADS_DIR จน validate ผ่าน
            let tempFilePath: string | undefined;
            let tempFileMime = "";
            let hasFile = false;

            if (req.isMultipart()) {
                const parts = req.parts();
                for await (const part of parts) {
                    if (part.type === "file") {
                        if (part.fieldname !== "img_after") {
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
                                "img_after must be JPEG, PNG, or WEBP"
                            );
                        }
                        const ext = pickExt(
                            part.filename ?? "upload",
                            part.mimetype
                        );
                        const tmpName = `${randomUUID()}${ext}`;
                        const osTmpBase = join(tmpdir(), "mth-uploads");
                        await ensureDir(osTmpBase);
                        tempFilePath = join(osTmpBase, tmpName);
                        await pipeline(
                            part.file,
                            createWriteStream(tempFilePath)
                        );
                        tempFileMime = part.mimetype;
                        hasFile = true;
                    } else {
                        const val =
                            typeof part.value === "string"
                                ? part.value
                                : String(part.value ?? "");
                        switch (part.fieldname) {
                            case "to_status_id": {
                                const n = Number(val);
                                if (Number.isFinite(n)) to_status_id = n;
                                break;
                            }
                            case "note":
                                if (val.trim()) note = val.trim();
                                break;
                            case "changed_by":
                                if (val.trim()) changed_by = val.trim();
                                break;
                            case "finished": {
                                const v = val.trim().toLowerCase();
                                finished =
                                    v === "true" || v === "1" || v === "yes";
                                break;
                            }
                        }
                    }
                }
            } else {
                const body = req.body as BodyJson;
                to_status_id = Number(body?.to_status_id);
                note = body?.note;
                changed_by = body?.changed_by;
                finished = body?.finished;
            }

            if (!to_status_id || isNaN(Number(to_status_id))) {
                if (tempFilePath) await unlink(tempFilePath).catch(() => {});
                return badRequest(reply, "to_status_id is required");
            }

            // ---------- transaction ----------
            try {
                const result = await prisma.$transaction(
                    async (tx: Prisma.TransactionClient) => {
                        // ตรวจสอบ report + history ล่าสุด
                        const report = await tx.report.findUnique({
                            where: { id },
                            select: {
                                id: true,
                                histories: {
                                    orderBy: { changed_at: "desc" },
                                    take: 1,
                                    select: {
                                        to_status: true,
                                        img_after: true,
                                    },
                                },
                            },
                        });
                        if (!report)
                            throw fastify.httpErrors.notFound(
                                "Report not found"
                            );

                        // ตรวจสอบ status ปลายทาง
                        const newStatus = await tx.status.findUnique({
                            where: { id: Number(to_status_id) },
                            select: {
                                id: true,
                                code: true,
                                label: true,
                                sort_order: true,
                                is_active: true,
                            },
                        });
                        if (!newStatus)
                            throw fastify.httpErrors.badRequest(
                                "Invalid status id"
                            );
                        if (!newStatus.is_active)
                            throw fastify.httpErrors.badRequest(
                                "Status is not active"
                            );

                        // ตรวจ DONE จาก max sort_order
                        const agg = await tx.status.aggregate({
                            _max: { sort_order: true },
                            where: { is_active: true },
                        });
                        const maxSort =
                            agg._max.sort_order ?? newStatus.sort_order;
                        const isSuccess = newStatus.sort_order === maxSort;

                        if (finished && !isSuccess) {
                            if (tempFilePath)
                                await unlink(tempFilePath).catch(() => {});
                            throw fastify.httpErrors.badRequest(
                                "finished can be set only when moving to the last (max sort_order) status"
                            );
                        }

                        const prev = report.histories[0];
                        const fromStatus = prev?.to_status ?? null;
                        const prevImgAfter = prev?.img_after ?? null;

                        // โฟลเดอร์ปลายทาง (หลัง validate ผ่าน)
                        const baseReportsDir = join(UPLOADS_DIR, "reports");
                        const reportDir = join(baseReportsDir, report.id);
                        const historyDir = join(reportDir, "histories");
                        await ensureDir(baseReportsDir);
                        await ensureDir(reportDir);
                        await ensureDir(historyDir);

                        // ---------- สร้างชื่อไฟล์แบบเดียวกัน ----------
                        // ลำดับ (count รูปทั้งหมดใน history ของรายงานนี้)
                        const existingCount =
                            await tx.reportStatusHistory.count({
                                where: {
                                    report_id: report.id,
                                    OR: [
                                        { img_before: { not: null } },
                                        { img_after: { not: null } },
                                    ],
                                },
                            });
                        const orderNo = existingCount + 1;

                        // ชื่อสถานะจาก label เป็นหลัก -> code -> status_<id>
                        const statusNameRaw = newStatus.code
                        const statusSlug = slugifyStatusName(statusNameRaw);

                        // วันเดือนปี
                        const today = formatDDMMYYYY(new Date());

                        // ตั้งชื่อเบื้องต้น + กันชื่อซ้ำ
                        const ext = pickExt(
                            undefined,
                            tempFileMime || "image/jpeg"
                        );
                        const baseName = `${orderNo}_${statusSlug}_${today}`;
                        const finalFileName = hasFile
                            ? await ensureUniqueFilename(
                                  historyDir,
                                  baseName,
                                  ext
                              )
                            : null;

                        // ย้ายไฟล์จาก OS tmp → history (ถ้ามีไฟล์)
                        if (hasFile && tempFilePath && finalFileName) {
                            const finalPath = join(historyDir, finalFileName);
                            await safeMove(tempFilePath, finalPath);
                            tempFilePath = undefined;
                        }

                        // บันทึก history (img_before = ของแถวล่าสุดก่อนหน้า)
                        const created = await tx.reportStatusHistory.create({
                            data: {
                                report_id: report.id,
                                from_status: fromStatus,
                                to_status: newStatus.id,
                                note: note ?? null,
                                changed_by: changed_by ?? null,
                                finished: !!finished,
                                finished_at: finished ? new Date() : null,
                                img_before: prevImgAfter,
                                img_after: finalFileName,
                            },
                            select: { id: true, report_id: true },
                        });

                        return {
                            reportId: created.report_id,
                            to_status_id: newStatus.id,
                            to_status_label: newStatus.label,
                            is_done_by_sort_order: isSuccess,
                            finished: !!finished,
                            img_before: prevImgAfter,
                            img_after: finalFileName,
                        };
                    }
                );

                return reply.code(200).send({ ok: true, ...result });
            } catch (err) {
                req.log.error({ err }, "updateStatusRoute failed");
                if (tempFilePath) {
                    await unlink(tempFilePath).catch(() => {});
                }
                if (err && (err as any).statusCode) {
                    throw err;
                }
                return reply
                    .code(500)
                    .send({ ok: false, error: "Internal error" });
            }
        }
    );
};

export default updateStatusRoute;
