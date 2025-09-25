interface NominatimResponse {
    display_name?: string;
    lat?: string;
    lon?: string;
    name?: string;
    address?: {
        road?: string;
        neighbourhood?: string;
        quarter?: string;
        suburb?: string;
        village?: string;
        town?: string;
        city?: string;
        county?: string;
        state?: string;
        postcode?: string;
        country?: string;
        building?: string;
    };
}

export async function reverseGeocode(lat: number, lng: number) {
    const USER_AGENT =
        process.env.NOMINATIM_UA ||
        "YourAppName/1.0 (contact: admin@example.com)";

    const u = new URL("https://nominatim.openstreetmap.org/reverse");
    u.searchParams.set("lat", String(lat));
    u.searchParams.set("lon", String(lng));
    u.searchParams.set("format", "jsonv2"); // ขอ JSON
    u.searchParams.set("accept-language", "th"); // ให้ผลภาษาไทยถ้ามี
    u.searchParams.set("addressdetails", "1"); // ขอ address object

    const res = await fetch(u, {
        headers: {
            "User-Agent": USER_AGENT,
        },
    });

    if (!res.ok) {
        throw new Error(`Nominatim error ${res.status}`);
    }

    const data = (await res.json()) as NominatimResponse;

    const addr = data.address || {};
    const address_full = data.display_name || data.name || null;

    // map → โครงสำหรับ Prisma
    const mapped = {
        address_full,
        address_country: addr.country ?? null,
        address_state: addr.state ?? null,
        address_county: addr.county ?? null,
        address_city: addr.city ?? addr.town ?? addr.village ?? null, // normalize
        address_town_borough: addr.quarter ?? null,
        address_village_suburb: addr.suburb ?? null,
        address_neighbourhood: addr.neighbourhood ?? null,
        address_any_settlement:
            addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? null,
        address_major_streets: addr.road ?? null,
        address_major_and_minor_streets: addr.road ?? null,
        address_building: addr.building ?? null,
    };
    
    return mapped;
}
