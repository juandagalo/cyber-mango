import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BoardService } from '../../../src/lib/server/services/board.service.js';
import { ColumnService } from '../../../src/lib/server/services/column.service.js';
import { CardService } from '../../../src/lib/server/services/card.service.js';
import { PhaseService } from '../../../src/lib/server/services/phase.service.js';
import { NotFoundError, ValidationError } from '../../../src/lib/server/errors.js';

describe('BoardService', () => {
    let boardService: BoardService;
    let columnService: ColumnService;
    let cardService: CardService;
    let phaseService: PhaseService;

    beforeEach(() => {
        const { db } = createTestDb();
        boardService = new BoardService(db);
        columnService = new ColumnService(db);
        cardService = new CardService(db);
        phaseService = new PhaseService(db);
    });

    describe('createBoard', () => {
        it('creates a board with valid input', () => {
            const board = boardService.createBoard({ name: 'My Board' });
            expect(board.id).toBeDefined();
            expect(board.name).toBe('My Board');
            expect(board.description).toBeNull();
        });

        it('creates a board with description', () => {
            const board = boardService.createBoard({ name: 'My Board', description: 'Test desc' });
            expect(board.description).toBe('Test desc');
        });

        it('throws ValidationError for empty name', () => {
            expect(() => boardService.createBoard({ name: '' })).toThrow(ValidationError);
        });

        it('throws ValidationError for whitespace-only name', () => {
            expect(() => boardService.createBoard({ name: '   ' })).toThrow(ValidationError);
        });

        it('throws ValidationError for name exceeding 255 chars', () => {
            expect(() => boardService.createBoard({ name: 'a'.repeat(256) })).toThrow(ValidationError);
        });

        it('trims whitespace from name', () => {
            const board = boardService.createBoard({ name: '  My Board  ' });
            expect(board.name).toBe('My Board');
        });
    });

    describe('listBoards', () => {
        it('returns empty array when no boards', () => {
            expect(boardService.listBoards()).toEqual([]);
        });

        it('returns all boards', () => {
            boardService.createBoard({ name: 'Board 1' });
            boardService.createBoard({ name: 'Board 2' });
            const list = boardService.listBoards();
            expect(list).toHaveLength(2);
        });
    });

    describe('getBoard', () => {
        it('returns board with columns and cards', () => {
            const board = boardService.createBoard({ name: 'Test Board' });
            const col = columnService.create({ boardId: board.id, name: 'To Do' });

            const result = boardService.getBoard(board.id);
            expect(result.id).toBe(board.id);
            expect(result.columns).toHaveLength(1);
            expect(result.columns[0].id).toBe(col.id);
            expect(result.columns[0].cards).toEqual([]);
        });

        it('throws NotFoundError for unknown board', () => {
            expect(() => boardService.getBoard('nonexistent')).toThrow(NotFoundError);
        });

        it('returns board with empty columns array when no columns', () => {
            const board = boardService.createBoard({ name: 'Empty Board' });
            const result = boardService.getBoard(board.id);
            expect(result.columns).toEqual([]);
        });
    });

    describe('getBoard — phases', () => {
        it('returns empty phases array when board has no phases', () => {
            const board = boardService.createBoard({ name: 'Test' });
            const result = boardService.getBoard(board.id);
            expect(result.phases).toEqual([]);
        });

        it('returns phases ordered by position', () => {
            const board = boardService.createBoard({ name: 'Test' });
            phaseService.create({ boardId: board.id, name: 'QA' });
            phaseService.create({ boardId: board.id, name: 'Dev' });
            const result = boardService.getBoard(board.id);
            expect(result.phases).toHaveLength(2);
            expect(result.phases[0].name).toBe('QA');
            expect(result.phases[1].name).toBe('Dev');
        });

        it('cards with assigned phase have full phase object', () => {
            const board = boardService.createBoard({ name: 'Test' });
            const col = columnService.create({ boardId: board.id, name: 'Col' });
            const phase = phaseService.create({ boardId: board.id, name: 'Dev' });
            cardService.create({ columnId: col.id, title: 'Card', phaseId: phase.id });
            const result = boardService.getBoard(board.id);
            const card = result.columns[0].cards[0];
            expect(card.phase).not.toBeNull();
            expect(card.phase!.id).toBe(phase.id);
            expect(card.phase!.name).toBe('Dev');
        });

        it('cards without phase have phase: null', () => {
            const board = boardService.createBoard({ name: 'Test' });
            const col = columnService.create({ boardId: board.id, name: 'Col' });
            cardService.create({ columnId: col.id, title: 'Card' });
            const result = boardService.getBoard(board.id);
            expect(result.columns[0].cards[0].phase).toBeNull();
        });
    });

    describe('getBoardSummary', () => {
        it('returns summary with zero counts for empty board', () => {
            const board = boardService.createBoard({ name: 'Empty' });
            const summary = boardService.getBoardSummary(board.id);
            expect(summary.boardId).toBe(board.id);
            expect(summary.totalCards).toBe(0);
            expect(summary.cardsByColumn).toEqual([]);
            expect(summary.cardsByPriority).toEqual([]);
            expect(summary.cardsByPhase).toEqual([]);
            expect(summary.totalTags).toBe(0);
        });

        it('returns cardsByPhase breakdown', () => {
            const board = boardService.createBoard({ name: 'Test' });
            const col = columnService.create({ boardId: board.id, name: 'Col' });
            const phase = phaseService.create({ boardId: board.id, name: 'Dev' });
            cardService.create({ columnId: col.id, title: 'Card 1', phaseId: phase.id });
            cardService.create({ columnId: col.id, title: 'Card 2' });
            const summary = boardService.getBoardSummary(board.id);
            expect(summary.cardsByPhase).toHaveLength(2);
            const devPhase = summary.cardsByPhase.find((p) => p.phaseId === phase.id);
            const nullPhase = summary.cardsByPhase.find((p) => p.phaseId === null);
            expect(devPhase?.count).toBe(1);
            expect(devPhase?.phaseName).toBe('Dev');
            expect(nullPhase?.count).toBe(1);
            expect(nullPhase?.phaseName).toBeNull();
        });

        it('throws NotFoundError for unknown board', () => {
            expect(() => boardService.getBoardSummary('nonexistent')).toThrow(NotFoundError);
        });
    });

    describe('ensureDefaultBoard', () => {
        it('creates a default board when none exist', () => {
            const id = boardService.ensureDefaultBoard();
            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
        });

        it('returns existing board id when boards already exist', () => {
            const board = boardService.createBoard({ name: 'Existing' });
            const id = boardService.ensureDefaultBoard();
            expect(id).toBe(board.id);
        });

        it('seeds 5 default phases for new board', () => {
            const boardId = boardService.ensureDefaultBoard();
            const boardData = boardService.getBoard(boardId);
            expect(boardData.phases).toHaveLength(5);
            expect(boardData.phases.map((p) => p.name)).toEqual([
                'Development', 'Code Review', 'QA', 'Client Review', 'Ready to Deploy'
            ]);
        });
    });
});
