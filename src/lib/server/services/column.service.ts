import { eq, asc, max, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../db/connection.js';
import { boards, columns, cards } from '../db/schema.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { generatePositions } from '../../utils/position.js';
import type { Column } from '../../types/board.js';

export class ColumnService {
    constructor(private readonly db: DrizzleDb) {}

    create(input: { boardId: string; name: string; color?: string; wipLimit?: number }): Column {
        if (!input.name || input.name.trim().length === 0) {
            throw new ValidationError('Column name cannot be empty');
        }

        const board = this.db.select({ id: boards.id }).from(boards).where(eq(boards.id, input.boardId)).get();
        if (!board) {
            throw new NotFoundError('Board', input.boardId);
        }

        const maxResult = this.db
            .select({ maxPos: max(columns.position) })
            .from(columns)
            .where(eq(columns.boardId, input.boardId))
            .get();

        const position = (maxResult?.maxPos ?? 0) + 1.0;
        const id = nanoid(12);
        const now = new Date().toISOString();

        this.db.insert(columns).values({
            id,
            boardId: input.boardId,
            name: input.name.trim(),
            color: input.color ?? '#6b7280',
            wipLimit: input.wipLimit ?? null,
            position,
            createdAt: now,
            updatedAt: now
        }).run();

        return this.db.select().from(columns).where(eq(columns.id, id)).get() as Column;
    }

    update(columnId: string, input: { name?: string; color?: string; wipLimit?: number | null }): Column {
        const column = this.db.select().from(columns).where(eq(columns.id, columnId)).get();
        if (!column) {
            throw new NotFoundError('Column', columnId);
        }

        if (input.name !== undefined && input.name.trim().length === 0) {
            throw new ValidationError('Column name cannot be empty');
        }

        const now = new Date().toISOString();
        const updateValues: Partial<typeof columns.$inferInsert> = { updatedAt: now };

        if (input.name !== undefined) {
            updateValues.name = input.name.trim();
        }
        if (input.color !== undefined) {
            updateValues.color = input.color;
        }
        if ('wipLimit' in input) {
            updateValues.wipLimit = input.wipLimit ?? null;
        }

        this.db.update(columns).set(updateValues).where(eq(columns.id, columnId)).run();

        return this.db.select().from(columns).where(eq(columns.id, columnId)).get() as Column;
    }

    delete(columnId: string): void {
        const column = this.db.select().from(columns).where(eq(columns.id, columnId)).get();
        if (!column) {
            throw new NotFoundError('Column', columnId);
        }

        // Check if this is the last column on the board
        const colCount = this.db
            .select({ count: count() })
            .from(columns)
            .where(eq(columns.boardId, column.boardId))
            .get();

        if ((colCount?.count ?? 0) <= 1) {
            throw new ValidationError('Cannot delete the last column on a board');
        }

        this.db.delete(columns).where(eq(columns.id, columnId)).run();
    }

    reorder(columnId: string, newPosition: number): Column {
        const column = this.db.select().from(columns).where(eq(columns.id, columnId)).get();
        if (!column) {
            throw new NotFoundError('Column', columnId);
        }

        const now = new Date().toISOString();
        this.db.update(columns).set({ position: newPosition, updatedAt: now }).where(eq(columns.id, columnId)).run();

        return this.db.select().from(columns).where(eq(columns.id, columnId)).get() as Column;
    }

    reindexPositions(boardId: string): void {
        const boardColumns = this.db
            .select()
            .from(columns)
            .where(eq(columns.boardId, boardId))
            .orderBy(asc(columns.position))
            .all();

        const positions = generatePositions(boardColumns.length);
        const now = new Date().toISOString();

        for (let i = 0; i < boardColumns.length; i++) {
            this.db
                .update(columns)
                .set({ position: positions[i], updatedAt: now })
                .where(eq(columns.id, boardColumns[i].id))
                .run();
        }
    }
}
