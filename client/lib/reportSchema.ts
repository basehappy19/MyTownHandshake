import { z } from "zod";

export const reportSchema = z.object({
    detail: z
        .string()
        .trim()
        .min(10, "กรุณากรอกอย่างน้อย 10 ตัวอักษร")
        .max(1000),

    // รับได้ทั้ง string/number/undefined จาก FormData แล้วแปลงเป็น number ที่ถูกต้อง
    lat: z
        .preprocess(
            (v) => (v === "" || v == null ? undefined : Number(v)),
            z.number().finite().optional()
        )
        .refine((v) => v === undefined || Number.isFinite(v), {
            message: "พิกัดไม่ถูกต้อง",
        }),

    lng: z
        .preprocess(
            (v) => (v === "" || v == null ? undefined : Number(v)),
            z.number().finite().optional()
        )
        .refine((v) => v === undefined || Number.isFinite(v), {
            message: "พิกัดไม่ถูกต้อง",
        }),
});

export type ReportInput = z.infer<typeof reportSchema>;
