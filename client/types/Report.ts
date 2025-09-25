export interface Report {
    id: number;
    detail: string;
    img: string;
    category: {
        name: string;
    };
    histories: History[];
    responsible: string;
    address: Address;
    created_at: string;
}

interface History {
    from: {
        label: string;
    };
    to: {
        label: string;
    };
    note: string;
    changed_at: string;
    img_before: string;
    img_after: string;
    finished: boolean
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
