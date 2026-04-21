import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema.js';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;

function resolveDbPath(): string {
	// Priority: CYBER_MANGO_DB_PATH > DB_PATH > default shared location
	if (process.env.CYBER_MANGO_DB_PATH) return process.env.CYBER_MANGO_DB_PATH;
	if (process.env.DB_PATH) return process.env.DB_PATH;

	// Default: shared location in user home so plugin + web UI use the same DB
	const home = process.env.USERPROFILE || process.env.HOME || '.';
	return `${home}/.cyber-mango/kanban.db`;
}

export function getDb() {
	if (db) return db;
	const dbPath = resolveDbPath();
	mkdirSync(dirname(dbPath), { recursive: true });
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('busy_timeout = 5000');
	sqlite.pragma('foreign_keys = ON');
	sqlite.pragma('synchronous = NORMAL');
	db = drizzle(sqlite, { schema });
	return db;
}

export function getRawDb() {
	getDb();
	return sqlite!;
}

export function closeDb() {
	if (sqlite) {
		sqlite.close();
		sqlite = null;
		db = null;
	}
}

export type DrizzleDb = ReturnType<typeof getDb>;
