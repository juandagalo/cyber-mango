import { nanoid } from 'nanoid';
import { getDb } from './connection.js';
import { boards, columns } from './schema.js';
import { count } from 'drizzle-orm';

export function seedDefaultBoard(): string {
	const db = getDb();

	// Check if any boards exist
	const boardCount = db.select({ count: count() }).from(boards).get();
	if (boardCount && boardCount.count > 0) {
		const existing = db.select({ id: boards.id }).from(boards).get();
		return existing!.id;
	}

	const boardId = nanoid(12);
	const now = new Date().toISOString();

	db.insert(boards).values({
		id: boardId,
		name: 'Cyber Mango',
		createdAt: now,
		updatedAt: now,
	}).run();

	const defaultColumns = [
		{ name: 'Backlog', position: 1.0, color: '#6b7280' },
		{ name: 'To Do', position: 2.0, color: '#3b82f6' },
		{ name: 'In Progress', position: 3.0, color: '#f59e0b' },
		{ name: 'Review', position: 4.0, color: '#8b5cf6' },
		{ name: 'Done', position: 5.0, color: '#10b981' },
	];

	for (const col of defaultColumns) {
		db.insert(columns).values({
			id: nanoid(12),
			boardId,
			name: col.name,
			position: col.position,
			color: col.color,
			createdAt: now,
			updatedAt: now,
		}).run();
	}

	return boardId;
}
