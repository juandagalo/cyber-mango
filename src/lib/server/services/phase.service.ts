import { eq, and, asc, max } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../db/connection.js';
import { boards, phases } from '../db/schema.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors.js';
import { generatePositions } from '../../utils/position.js';
import type { Phase } from '../../types/board.js';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export class PhaseService {
    constructor(private readonly db: DrizzleDb) {}

    create(input: { boardId: string; name: string; color?: string }): Phase {
        const name = input.name?.trim();
        if (!name || name.length === 0) {
            throw new ValidationError('Phase name cannot be empty');
        }
        if (name.length > 50) {
            throw new ValidationError('Phase name cannot exceed 50 characters');
        }
        if (input.color !== undefined && !HEX_COLOR_REGEX.test(input.color)) {
            throw new ValidationError('Phase color must be a valid hex color (e.g. #00FFFF)');
        }

        const board = this.db.select({ id: boards.id }).from(boards).where(eq(boards.id, input.boardId)).get();
        if (!board) {
            throw new NotFoundError('Board', input.boardId);
        }

        const existing = this.db
            .select({ id: phases.id })
            .from(phases)
            .where(and(eq(phases.boardId, input.boardId), eq(phases.name, name)))
            .get();

        if (existing) {
            throw new ConflictError(`Phase '${name}' already exists on this board`);
        }

        const maxResult = this.db
            .select({ maxPos: max(phases.position) })
            .from(phases)
            .where(eq(phases.boardId, input.boardId))
            .get();

        const position = (maxResult?.maxPos ?? 0) + 1.0;
        const id = nanoid(12);
        const now = new Date().toISOString();

        try {
            this.db.insert(phases).values({
                id,
                boardId: input.boardId,
                name,
                color: input.color ?? '#00FFFF',
                position,
                createdAt: now,
                updatedAt: now
            }).run();
        } catch (err) {
            if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
                throw new ConflictError(`Phase '${name}' already exists on this board`);
            }
            throw err;
        }

        return this.db.select().from(phases).where(eq(phases.id, id)).get() as Phase;
    }

    listByBoard(boardId: string): Phase[] {
        return this.db
            .select()
            .from(phases)
            .where(eq(phases.boardId, boardId))
            .orderBy(asc(phases.position))
            .all() as Phase[];
    }

    getById(phaseId: string): Phase {
        const phase = this.db.select().from(phases).where(eq(phases.id, phaseId)).get();
        if (!phase) {
            throw new NotFoundError('Phase', phaseId);
        }
        return phase as Phase;
    }

    update(phaseId: string, input: { name?: string; color?: string }): Phase {
        const phase = this.db.select().from(phases).where(eq(phases.id, phaseId)).get();
        if (!phase) {
            throw new NotFoundError('Phase', phaseId);
        }

        if (input.name !== undefined) {
            const name = input.name.trim();
            if (name.length === 0) {
                throw new ValidationError('Phase name cannot be empty');
            }
            if (name.length > 50) {
                throw new ValidationError('Phase name cannot exceed 50 characters');
            }

            const existing = this.db
                .select({ id: phases.id })
                .from(phases)
                .where(and(eq(phases.boardId, phase.boardId), eq(phases.name, name)))
                .get();

            if (existing && existing.id !== phaseId) {
                throw new ConflictError(`Phase '${name}' already exists on this board`);
            }
        }

        if (input.color !== undefined && !HEX_COLOR_REGEX.test(input.color)) {
            throw new ValidationError('Phase color must be a valid hex color (e.g. #00FFFF)');
        }

        const now = new Date().toISOString();
        const updateValues: Partial<typeof phases.$inferInsert> = { updatedAt: now };

        if (input.name !== undefined) {
            updateValues.name = input.name.trim();
        }
        if (input.color !== undefined) {
            updateValues.color = input.color;
        }

        this.db.update(phases).set(updateValues).where(eq(phases.id, phaseId)).run();

        return this.db.select().from(phases).where(eq(phases.id, phaseId)).get() as Phase;
    }

    delete(phaseId: string): void {
        const phase = this.db.select({ id: phases.id }).from(phases).where(eq(phases.id, phaseId)).get();
        if (!phase) {
            throw new NotFoundError('Phase', phaseId);
        }

        this.db.delete(phases).where(eq(phases.id, phaseId)).run();
    }

    reorder(boardId: string, orderedIds: string[]): Phase[] {
        const board = this.db.select({ id: boards.id }).from(boards).where(eq(boards.id, boardId)).get();
        if (!board) {
            throw new NotFoundError('Board', boardId);
        }

        const existing = this.db
            .select()
            .from(phases)
            .where(eq(phases.boardId, boardId))
            .all();

        if (orderedIds.length !== existing.length) {
            throw new ValidationError('orderedIds length does not match phase count');
        }

        const existingIds = new Set(existing.map((p) => p.id));
        for (const id of orderedIds) {
            if (!existingIds.has(id)) {
                throw new ValidationError('Phase IDs do not all belong to this board');
            }
        }

        const positions = generatePositions(orderedIds.length);
        const now = new Date().toISOString();

        for (let i = 0; i < orderedIds.length; i++) {
            this.db
                .update(phases)
                .set({ position: positions[i], updatedAt: now })
                .where(eq(phases.id, orderedIds[i]))
                .run();
        }

        return this.listByBoard(boardId);
    }
}
