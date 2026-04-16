import { eq, asc, count, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../db/connection.js';
import { boards, columns, cards, tags, cardTags, phases } from '../db/schema.js';
import { NotFoundError, ValidationError } from '../errors.js';
import type { Board, BoardWithColumns, BoardSummary, ColumnWithCards, CardWithTags, Phase, Priority } from '../../types/board.js';

export class BoardService {
    constructor(private readonly db: DrizzleDb) {}

    listBoards(): Board[] {
        return this.db.select().from(boards).all() as Board[];
    }

    getBoard(boardId: string): BoardWithColumns {
        const board = this.db.select().from(boards).where(eq(boards.id, boardId)).get();
        if (!board) {
            throw new NotFoundError('Board', boardId);
        }

        const boardColumns = this.db
            .select()
            .from(columns)
            .where(eq(columns.boardId, boardId))
            .orderBy(asc(columns.position))
            .all();

        const columnIds = boardColumns.map((c) => c.id);

        // Load board phases
        const boardPhases = this.db
            .select()
            .from(phases)
            .where(eq(phases.boardId, boardId))
            .orderBy(asc(phases.position))
            .all() as Phase[];

        const phaseMap = new Map<string, Phase>();
        for (const p of boardPhases) {
            phaseMap.set(p.id, p);
        }

        if (columnIds.length === 0) {
            return {
                ...(board as Board),
                columns: [],
                phases: boardPhases
            };
        }

        const allCards = this.db
            .select()
            .from(cards)
            .where(sql`${cards.columnId} IN (${sql.join(columnIds.map((id) => sql`${id}`), sql`, `)})`)
            .orderBy(asc(cards.position))
            .all();

        const cardIds = allCards.map((c) => c.id);

        let cardTagsData: { cardId: string; tagId: string; tagName: string; tagColor: string; tagBoardId: string; tagCreatedAt: string }[] = [];

        if (cardIds.length > 0) {
            cardTagsData = this.db
                .select({
                    cardId: cardTags.cardId,
                    tagId: tags.id,
                    tagName: tags.name,
                    tagColor: tags.color,
                    tagBoardId: tags.boardId,
                    tagCreatedAt: tags.createdAt
                })
                .from(cardTags)
                .innerJoin(tags, eq(cardTags.tagId, tags.id))
                .where(sql`${cardTags.cardId} IN (${sql.join(cardIds.map((id) => sql`${id}`), sql`, `)})`)
                .all();
        }

        // Group tags by card
        const tagsByCard = new Map<string, import('../../types/board.js').Tag[]>();
        for (const row of cardTagsData) {
            if (!tagsByCard.has(row.cardId)) {
                tagsByCard.set(row.cardId, []);
            }
            tagsByCard.get(row.cardId)!.push({
                id: row.tagId,
                boardId: row.tagBoardId,
                name: row.tagName,
                color: row.tagColor,
                createdAt: row.tagCreatedAt
            });
        }

        // Group cards by column
        const cardsByColumn = new Map<string, CardWithTags[]>();
        for (const card of allCards) {
            if (!cardsByColumn.has(card.columnId)) {
                cardsByColumn.set(card.columnId, []);
            }
            cardsByColumn.get(card.columnId)!.push({
                id: card.id,
                columnId: card.columnId,
                title: card.title,
                description: card.description ?? null,
                priority: (card.priority ?? 'medium') as Priority,
                position: card.position,
                createdAt: card.createdAt,
                updatedAt: card.updatedAt,
                tags: tagsByCard.get(card.id) ?? [],
                phase: card.phaseId ? phaseMap.get(card.phaseId) ?? null : null
            });
        }

        const columnsWithCards: ColumnWithCards[] = boardColumns.map((col) => ({
            id: col.id,
            boardId: col.boardId,
            name: col.name,
            color: col.color ?? null,
            wipLimit: col.wipLimit ?? null,
            position: col.position,
            createdAt: col.createdAt,
            updatedAt: col.updatedAt,
            cards: cardsByColumn.get(col.id) ?? []
        }));

        return {
            ...(board as Board),
            columns: columnsWithCards,
            phases: boardPhases
        };
    }

    createBoard(input: { name: string; description?: string }): Board {
        if (!input.name || input.name.trim().length === 0) {
            throw new ValidationError('Board name cannot be empty');
        }
        if (input.name.length > 255) {
            throw new ValidationError('Board name cannot exceed 255 characters');
        }

        const id = nanoid(12);
        const now = new Date().toISOString();

        this.db.insert(boards).values({
            id,
            name: input.name.trim(),
            description: input.description ?? null,
            createdAt: now,
            updatedAt: now
        }).run();

        return this.db.select().from(boards).where(eq(boards.id, id)).get() as Board;
    }

    getBoardSummary(boardId: string): BoardSummary {
        const board = this.db.select().from(boards).where(eq(boards.id, boardId)).get();
        if (!board) {
            throw new NotFoundError('Board', boardId);
        }

        const boardColumns = this.db
            .select()
            .from(columns)
            .where(eq(columns.boardId, boardId))
            .all();

        const columnIds = boardColumns.map((c) => c.id);

        if (columnIds.length === 0) {
            return {
                boardId,
                boardName: board.name,
                totalCards: 0,
                cardsByColumn: [],
                cardsByPriority: [],
                cardsByPhase: [],
                totalTags: 0
            };
        }

        // Count cards per column
        const cardsByColumn: BoardSummary['cardsByColumn'] = [];
        let totalCards = 0;

        for (const col of boardColumns) {
            const result = this.db
                .select({ count: count() })
                .from(cards)
                .where(eq(cards.columnId, col.id))
                .get();
            const colCount = result?.count ?? 0;
            totalCards += colCount;
            cardsByColumn.push({
                columnId: col.id,
                columnName: col.name,
                count: colCount,
                wipLimit: col.wipLimit ?? null
            });
        }

        // Count cards per priority using GROUP BY
        const priorityResults = this.db
            .select({
                priority: cards.priority,
                count: count()
            })
            .from(cards)
            .where(sql`${cards.columnId} IN (${sql.join(columnIds.map((id) => sql`${id}`), sql`, `)})`)
            .groupBy(cards.priority)
            .all();

        const cardsByPriority: BoardSummary['cardsByPriority'] = priorityResults.map((row) => ({
            priority: (row.priority ?? 'medium') as Priority,
            count: row.count
        }));

        // Count cards per phase
        const phaseResults = this.db
            .select({
                phaseId: cards.phaseId,
                count: count()
            })
            .from(cards)
            .where(sql`${cards.columnId} IN (${sql.join(columnIds.map((id) => sql`${id}`), sql`, `)})`)
            .groupBy(cards.phaseId)
            .all();

        const boardPhases = this.db
            .select()
            .from(phases)
            .where(eq(phases.boardId, boardId))
            .all();
        const phaseNameMap = new Map<string, string>();
        for (const p of boardPhases) {
            phaseNameMap.set(p.id, p.name);
        }

        const cardsByPhase: BoardSummary['cardsByPhase'] = phaseResults.map((row) => ({
            phaseId: row.phaseId,
            phaseName: row.phaseId ? phaseNameMap.get(row.phaseId) ?? null : null,
            count: row.count
        }));

        // Count tags for board
        const tagsResult = this.db
            .select({ count: count() })
            .from(tags)
            .where(eq(tags.boardId, boardId))
            .get();
        const totalTags = tagsResult?.count ?? 0;

        return {
            boardId,
            boardName: board.name,
            totalCards,
            cardsByColumn,
            cardsByPriority,
            cardsByPhase,
            totalTags
        };
    }

    ensureDefaultBoard(): string {
        const existing = this.db.select({ id: boards.id }).from(boards).get();
        if (existing) {
            return existing.id;
        }

        // Seed a default board with standard columns
        const boardId = nanoid(12);
        const now = new Date().toISOString();

        this.db.insert(boards).values({
            id: boardId,
            name: 'Cyber Mango',
            createdAt: now,
            updatedAt: now
        }).run();

        const defaultColumns = [
            { name: 'Backlog', position: 1.0, color: '#6b7280' },
            { name: 'To Do', position: 2.0, color: '#3b82f6' },
            { name: 'In Progress', position: 3.0, color: '#f59e0b' },
            { name: 'Review', position: 4.0, color: '#8b5cf6' },
            { name: 'Done', position: 5.0, color: '#10b981' },
        ];

        for (const col of defaultColumns) {
            this.db.insert(columns).values({
                id: nanoid(12),
                boardId,
                name: col.name,
                position: col.position,
                color: col.color,
                createdAt: now,
                updatedAt: now
            }).run();
        }

        const defaultPhases = [
            { name: 'Development',     color: '#00FFFF', position: 1.0 },
            { name: 'Code Review',     color: '#BF00FF', position: 2.0 },
            { name: 'QA',              color: '#FCEE0A', position: 3.0 },
            { name: 'Client Review',   color: '#FF00FF', position: 4.0 },
            { name: 'Ready to Deploy', color: '#39FF14', position: 5.0 },
        ];

        for (const p of defaultPhases) {
            this.db.insert(phases).values({
                id: nanoid(12),
                boardId,
                name: p.name,
                color: p.color,
                position: p.position,
                createdAt: now,
                updatedAt: now
            }).run();
        }

        return boardId;
    }
}
