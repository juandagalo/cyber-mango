import { eq, asc, max } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../db/connection.js';
import { columns, cards, tags, cardTags } from '../db/schema.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { generatePositions } from '../../utils/position.js';
import type { CardWithTags, Priority } from '../../types/board.js';

export class CardService {
    constructor(private readonly db: DrizzleDb) {}

    create(input: { columnId: string; title: string; description?: string; priority?: string }): CardWithTags {
        if (!input.title || input.title.trim().length === 0) {
            throw new ValidationError('Card title cannot be empty');
        }

        const column = this.db.select({ id: columns.id }).from(columns).where(eq(columns.id, input.columnId)).get();
        if (!column) {
            throw new NotFoundError('Column', input.columnId);
        }

        const maxResult = this.db
            .select({ maxPos: max(cards.position) })
            .from(cards)
            .where(eq(cards.columnId, input.columnId))
            .get();

        const position = (maxResult?.maxPos ?? 0) + 1.0;
        const id = nanoid(12);
        const now = new Date().toISOString();

        this.db.insert(cards).values({
            id,
            columnId: input.columnId,
            title: input.title.trim(),
            description: input.description ?? '',
            priority: (input.priority as Priority) ?? 'medium',
            position,
            createdAt: now,
            updatedAt: now
        }).run();

        return this.getById(id);
    }

    getById(cardId: string): CardWithTags {
        const card = this.db.select().from(cards).where(eq(cards.id, cardId)).get();
        if (!card) {
            throw new NotFoundError('Card', cardId);
        }

        const cardTagsData = this.db
            .select({
                tagId: tags.id,
                tagName: tags.name,
                tagColor: tags.color,
                tagBoardId: tags.boardId,
                tagCreatedAt: tags.createdAt
            })
            .from(cardTags)
            .innerJoin(tags, eq(cardTags.tagId, tags.id))
            .where(eq(cardTags.cardId, cardId))
            .all();

        return {
            id: card.id,
            columnId: card.columnId,
            title: card.title,
            description: card.description ?? null,
            priority: (card.priority ?? 'medium') as Priority,
            position: card.position,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
            tags: cardTagsData.map((t) => ({
                id: t.tagId,
                boardId: t.tagBoardId,
                name: t.tagName,
                color: t.tagColor,
                createdAt: t.tagCreatedAt
            }))
        };
    }

    update(cardId: string, input: { title?: string; description?: string; priority?: string }): CardWithTags {
        const card = this.db.select().from(cards).where(eq(cards.id, cardId)).get();
        if (!card) {
            throw new NotFoundError('Card', cardId);
        }

        if (input.title !== undefined && input.title.trim().length === 0) {
            throw new ValidationError('Card title cannot be empty');
        }

        const now = new Date().toISOString();
        const updateValues: Partial<typeof cards.$inferInsert> = { updatedAt: now };

        if (input.title !== undefined) {
            updateValues.title = input.title.trim();
        }
        if (input.description !== undefined) {
            updateValues.description = input.description;
        }
        if (input.priority !== undefined) {
            updateValues.priority = input.priority as Priority;
        }

        this.db.update(cards).set(updateValues).where(eq(cards.id, cardId)).run();

        return this.getById(cardId);
    }

    move(cardId: string, input: { columnId: string; position: number }): CardWithTags {
        const card = this.db.select().from(cards).where(eq(cards.id, cardId)).get();
        if (!card) {
            throw new NotFoundError('Card', cardId);
        }

        const column = this.db.select({ id: columns.id }).from(columns).where(eq(columns.id, input.columnId)).get();
        if (!column) {
            throw new NotFoundError('Column', input.columnId);
        }

        const now = new Date().toISOString();
        this.db
            .update(cards)
            .set({ columnId: input.columnId, position: input.position, updatedAt: now })
            .where(eq(cards.id, cardId))
            .run();

        return this.getById(cardId);
    }

    delete(cardId: string): void {
        const card = this.db.select({ id: cards.id }).from(cards).where(eq(cards.id, cardId)).get();
        if (!card) {
            throw new NotFoundError('Card', cardId);
        }

        this.db.delete(cards).where(eq(cards.id, cardId)).run();
    }

    reindexPositions(columnId: string): void {
        const columnCards = this.db
            .select()
            .from(cards)
            .where(eq(cards.columnId, columnId))
            .orderBy(asc(cards.position))
            .all();

        const positions = generatePositions(columnCards.length);
        const now = new Date().toISOString();

        for (let i = 0; i < columnCards.length; i++) {
            this.db
                .update(cards)
                .set({ position: positions[i], updatedAt: now })
                .where(eq(cards.id, columnCards[i].id))
                .run();
        }
    }
}
