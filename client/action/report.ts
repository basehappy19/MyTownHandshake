"use server";

import { reportSchema } from "@/lib/reportSchema";
import { z } from "zod";

const serverFormSchema = reportSchema.extend({
    lat: z.preprocess(
        (v) => (v === "" || v == null ? undefined : Number(v)),
        z.number().optional()
    ),
    lng: z.preprocess(
        (v) => (v === "" || v == null ? undefined : Number(v)),
        z.number().optional()
    ),
});

export async function submitOfficialReport(formData: FormData) {
    const data = {
        detail: formData.get("detail"),
        lat: formData.get("lat"),
        lng: formData.get("lng"),
    };

    const parsed = serverFormSchema.safeParse(data);
    if (!parsed.success) {
        return {
            ok: false as const,
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    const files: File[] = [];
    formData.getAll("photos").forEach((f) => {
        if (f instanceof File && f.size > 0) files.push(f);
    });

    
    await new Promise((r) => setTimeout(r, 600));

    return { ok: true as const };
}
