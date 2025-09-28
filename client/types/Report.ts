import { statusRaw } from "@/app/page";

export interface Report {
    id: string;
    detail: string;
    img: string;
    code: string;
    category: {
        name: string;
    };
    rate: string
    histories: History[];
    last_history?: History;
    responsible: {
        display_name: string
    };
    finished_at?: string;
    duration?: Duration;
    address: Address;
    created_at: string;
}

export interface Duration {
    milliseconds: number;
    minutes: number;
    hours: number;
    days: number;
    weeks: number;
    months: number;
    years: number;
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
