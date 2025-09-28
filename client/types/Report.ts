import { statusRaw } from "@/app/page";

export interface Report {
    id: number;
    detail: string;
    img: string;
    code: string;
    category: {
        name: string;
    };
    histories: History[];
    last_finished_history?: History;
    responsible: string;
    duration?: {
        milliseconds: number;
        minutes: number;
        hours: number;
        days: number;
        weeks: number;
        months: number;
        years: number;
    };
    address: Address;
    created_at: string;
}

interface History {
    id: number;
    from: statusRaw["items"][number];
    to: statusRaw["items"][number];
    note: string;
    changed_at: string;
    img_before: string;
    img_after: string;
    finished: boolean;
}

export interface Address {
    lat: number;
    lng: number;
    address_full: string | null;
    address_country: string | null;
    address_state: string | null;
    address_county: string | null;
    address_city: string | null;
    address_town_borough: string | null;
    address_village_suburb: string | null;
    address_neighbourhood: string | null;
    address_any_settlement: string | null;
    address_major_streets: string | null;
    address_major_and_minor_streets: string | null;
    address_building: string | null;
}
