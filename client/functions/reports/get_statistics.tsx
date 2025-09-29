'use server'

export const getStatuses = async () => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/statistic/statuses`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch statistic: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()
        return data
    } catch (e) {
        console.error("Error fetching statistic:", e)
        return { ok: false, error: (e as Error).message }
    }
}
