import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../db/connection.js';
import { boards, cards, tags, cardTags } from '../db/schema.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors.js';
import type { Tag } from '../../types/board.js';

export class TagService {
    constructor(private readonly db: DrizzleDb) {}

    create(input: { boardId: string; name: string; color?: string }): Tag {
        if (!input.name || input.name.trim().length === 0) {
            throw new ValidationError('Tag name cannot be empty');
        }
        if (input.name.length > 50) {
            throw new ValidationError('Tag name cannot exceed 50 characters');
        }

        const board = this.db.select({ id: boards.id }).from(boards).where(eq(boards.id, input.boardId)).get();
        if (!board) {
            throw new NotFoundError('Board', input.boardId);
        }

        // Check for name uniqueness on board
        const existing = this.db
            .select({ id: tags.id })
            .from(tags)
            .where(and(eq(tags.boardId, input.boardId), eq(tags.name, input.name.trim())))
            .get();

        if (existing) {
            throw new ConflictError(`Tag '${input.name}' already exists on this board`);
        }

        const id = nanoid(12);
        const now = new Date().toISOString();

        try {
            this.db.insert(tags).values({
                id,
                boardId: input.boardId,
                name: input.name.trim(),
                color: input.color ?? '#3b82f6',
                createdAt: now
            }).run();
        } catch (err) {
            // Catch unique constraint violation from DB as well
            if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
                throw new ConflictError(`Tag '${input.name}' already exists on this board`);
            }
            throw err;
        }

        return this.db.select().from(tags).where(eq(tags.id, id)).get() as Tag;
    }

    listByBoard(boardId: string): Tag[] {
        return this.db.select().from(tags).where(eq(tags.boardId, boardId)).all() as Tag[];
    }

    update(tagId: string, input: { name?: string; color?: string }): Tag {
        const tag = this.db.select().from(tags).where(eq(tags.id, tagId)).get();
        if (!tag) {
            throw new NotFoundError('Tag', tagId);
        }

        if (input.name !== undefined && input.name.trim().length === 0) {
            throw new ValidationError('Tag name cannot be empty');
        }

        if (input.name !== undefined) {
            const existing = this.db
                .select({ id: tags.id })
                .from(tags)
                .where(and(eq(tags.boardId, tag.boardId), eq(tags.name, input.name.trim())))
                .get();

            if (existing && existing.id !== tagId) {
                throw new ConflictError(`Tag '${input.name}' already exists on this board`);
            }
        }

        const updateValues: Partial<typeof tags.$inferInsert> = {};

        if (input.name !== undefined) {
            updateValues.name = input.name.trim();
        }
        if (input.color !== undefined) {
            updateValues.color = input.color;
        }

        this.db.update(tags).set(updateValues).where(eq(tags.id, tagId)).run();

        return this.db.select().from(tags).where(eq(tags.id, tagId)).get() as Tag;
    }

    delete(tagId: string): void {
        const tag = this.db.select({ id: tags.id }).from(tags).where(eq(tags.id, tagId)).get();
        if (!tag) {
            throw new NotFoundError('Tag', tagId);
        }

        this.db.delete(tags).where(eq(tags.id, tagId)).run();
    }

    assignToCard(cardId: string, tagId: string): void {
        const card = this.db.select({ id: cards.id }).from(cards).where(eq(cards.id, cardId)).get();
        if (!card) {
            throw new NotFoundError('Card', cardId);
        }

        const tag = this.db.select({ id: tags.id }).from(tags).where(eq(tags.id, tagId)).get();
        if (!tag) {
            throw new NotFoundError('Tag', tagId);
        }

        // INSERT OR IGNORE for idempotency — use raw SQLite via run on conflict do nothing
        try {
            this.db.insert(cardTags).values({ cardId, tagId }).run();
        } catch (err) {
            // Swallow unique constraint — idempotent
            if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
                return;
            }
            throw err;
        }
    }

    removeFromCard(cardId: string, tagId: string): void {
        // Idempotent — no error if not assigned
        this.db.delete(cardTags).where(and(eq(cardTags.cardId, cardId), eq(cardTags.tagId, tagId))).run();
    }
}
