import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb, getRawDb } from './connection.js';

export function runMigrations() {
	const db = getDb();
	const raw = getRawDb();
	// SQLite ignores PRAGMA foreign_keys changes inside transactions.
	// Drizzle wraps migrations in transactions, so table-recreation migrations
	// that rely on foreign_keys=OFF will silently fail, triggering ON DELETE CASCADE.
	raw.pragma('foreign_keys = OFF');
	migrate(db, { migrationsFolder: './drizzle' });
	raw.pragma('foreign_keys = ON');
}
