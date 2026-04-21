import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const boards = sqliteTable('boards', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
	updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
});

export const columns = sqliteTable('columns', {
	id: text('id').primaryKey(),
	boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color').default('#6b7280'),
	wipLimit: integer('wip_limit'),
	position: real('position').notNull(),
	createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
	updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
}, (t) => [
	index('idx_columns_board_position').on(t.boardId, t.position)
]);

export const cards = sqliteTable('cards', {
	id: text('id').primaryKey(),
	columnId: text('column_id').notNull().references(() => columns.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description').default(''),
	priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
	position: real('position').notNull(),
	phaseId: text('phase_id').references(() => phases.id, { onDelete: 'set null' }),
	parentCardId: text('parent_card_id').references((): AnySQLiteColumn => cards.id, { onDelete: 'set null' }),
	dueDate: text('due_date'),
	createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
	updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
}, (t) => [
	index('idx_cards_column_position').on(t.columnId, t.position)
]);

export const phases = sqliteTable('phases', {
	id: text('id').primaryKey(),
	boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color').notNull().default('#00FFFF'),
	position: real('position').notNull(),
	createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
	updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
}, (t) => [
	index('idx_phases_board_position').on(t.boardId, t.position),
	uniqueIndex('idx_phases_board_name').on(t.boardId, t.name)
]);

export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color').notNull().default('#3b82f6'),
	createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
}, (t) => [
	index('idx_tags_board').on(t.boardId),
	uniqueIndex('idx_tags_board_name').on(t.boardId, t.name)
]);

export const cardTags = sqliteTable('card_tags', {
	cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
	tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (t) => [
	primaryKey({ columns: [t.cardId, t.tagId] }),
	index('idx_card_tags_card').on(t.cardId),
	index('idx_card_tags_tag').on(t.tagId)
]);

export const activityLog = sqliteTable('activity_log', {
	id: text('id').primaryKey(),
	boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
	cardId: text('card_id'),
	action: text('action').notNull(),
	details: text('details'),
	agent: text('agent'),
	createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
});
