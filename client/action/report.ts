"use server";

import { revalidatePath } from "next/cache";

export async function submitOfficialReport(formData: FormData) {
    const detail = formData.get("detail");
    const lat = formData.get("lat");
    const lng = formData.get("lng");
    const user_agent = formData.get("user_agent");

    const file = formData.get("img");
    const img = file instanceof File && file.size > 0 ? file : null;

    const fd = new FormData();
    if (detail) fd.append("detail", String(detail));
    if (lat) fd.append("lat", String(lat));
    if (lng) fd.append("lng", String(lng));
    if (img) fd.append("img", img);
    if (user_agent) fd.append("user_agent", user_agent);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${apiBase}/report`, {
        method: "POST",
        body: fd,
    });

    if (!res.ok) {
        return { ok: false as const, error: "UPLOAD_FAILED" as const };
    }

    revalidatePath("/report");
    return { ok: true as const };
}
