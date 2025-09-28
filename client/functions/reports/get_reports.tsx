'use server'

export const getReports = async (search?: string) => {
    try {
        const base = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/reports`;

        const url = search && search.trim()
            ? `${base}?q=${encodeURIComponent(search.trim())}`
            : base;

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Error fetching reports:", e);
        return { ok: false, error: (e as Error).message };
    }
};

export const getReportsFinished = async (search?: string) => {
    try {
        const base = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/reports/finished`;

        const url = search && search.trim()
            ? `${base}?q=${encodeURIComponent(search.trim())}`
            : base;

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Error fetching reports:", e);
        return { ok: false, error: (e as Error).message };
    }
};

export const getReport = async (id?: string) => {
    try {
        if (!id || !id.trim()) {
            throw new Error("Report id is required");
        }

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/report/${encodeURIComponent(
            id.trim()
        )}`;

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch report: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Error fetching report:", e);
        return { ok: false, error: (e as Error).message };
    }
};

