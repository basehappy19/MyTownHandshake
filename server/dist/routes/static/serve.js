"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = imagesRoutes;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("stream/promises");
function guessContentType(p) {
    switch (path_1.default.extname(p).toLowerCase()) {
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
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
async function imagesRoutes(fastify) {
    fastify.get("/report/image/:reportId", async (req, reply) => {
        const { reportId } = req.params;
        if (!UUID_RE.test(reportId)) {
            return reply
                .code(400)
                .send({ error: "Invalid reportId (must be UUID)" });
        }
        const r = await fastify.prisma.report.findUnique({
            where: { id: reportId },
            select: { img: true },
        });
        if (!r?.img) {
            return reply
                .code(404)
                .send({ message: "Report or image not found" });
        }
        const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path_1.default.join(process.cwd(), "uploads");
        const REPORTS_DIR = path_1.default.join(UPLOADS_DIR, "reports");
        const filePath = path_1.default.join(REPORTS_DIR, path_1.default.basename(r.img));
        try {
            const stat = await fs_1.default.promises.stat(filePath);
            reply.header("Content-Type", guessContentType(filePath));
            reply.header("Content-Length", String(stat.size));
            reply.header("Cache-Control", "public, max-age=3600");
            await (0, promises_1.pipeline)(fs_1.default.createReadStream(filePath), reply.raw);
        }
        catch {
            return reply.code(404).send({ message: "File not found" });
        }
    });
}
