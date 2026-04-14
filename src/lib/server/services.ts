import { getDb } from '$lib/server/db/connection.js';
import { createServices } from '$lib/server/services/index.js';

let services: ReturnType<typeof createServices> | null = null;

export function getServices() {
    if (!services) {
        services = createServices(getDb());
    }
    return services;
}
