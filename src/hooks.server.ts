import { runMigrations } from '$lib/server/db/migrate.js';
import { getServices } from '$lib/server/services.js';

// Run migrations and seed on server startup
runMigrations();
const services = getServices();
services.boards.ensureDefaultBoard();
