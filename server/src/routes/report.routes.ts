import router from "./auth.routes.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";

router.get("/:id", async (req, res) => {
    const r = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!r) return res.status(404).json({ error: "Not found" });
    res.json(r);
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
    const parsed = CreateReportSchema.safeParse({
        ...req.body,
        lat: req.body.lat ? Number(req.body.lat) : undefined,
        lng: req.body.lng ? Number(req.body.lng) : undefined,
        meta: req.body.meta ? JSON.parse(req.body.meta) : undefined,
    });
    if (!parsed.success) {
        // ถ้ามีไฟล์แล้ว validate fail ลบไฟล์ทิ้ง
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const imagePath = req.file
        ? path.join("uploads", "reports", path.basename(req.file.path))
        : undefined;

    const report = await prisma.report.create({
        data: {
            ...parsed.data,
            imagePath,
            userId: req.user!.id,
        },
    });
    res.status(201).json(report);
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
    const { status } = req.body as { status?: string };
    const ok = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"].includes(
        status || ""
    );
    if (!ok) return res.status(400).json({ error: "Invalid status" });

    const updated = await prisma.report.update({
        where: { id: req.params.id },
        data: { status: status as any },
    });
    res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
    const r = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!r) return res.status(404).json({ error: "Not found" });
    if (req.user!.role !== "ADMIN" && r.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
    }
    if (r.imagePath && fs.existsSync(r.imagePath))
        fs.unlink(r.imagePath, () => {});
    await prisma.report.delete({ where: { id: r.id } });
    res.json({ ok: true });
});

export default router;
