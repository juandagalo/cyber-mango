import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BoardService } from '../../../src/lib/server/services/board.service.js';
import { ColumnService } from '../../../src/lib/server/services/column.service.js';
import { NotFoundError, ValidationError } from '../../../src/lib/server/errors.js';

describe('BoardService', () => {
    let boardService: BoardService;
    let columnService: ColumnService;

    beforeEach(() => {
        const { db } = createTestDb();
        boardService = new BoardService(db);
        columnService = new ColumnService(db);
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

    describe('getBoardSummary', () => {
        it('returns summary with zero counts for empty board', () => {
            const board = boardService.createBoard({ name: 'Empty' });
            const summary = boardService.getBoardSummary(board.id);
            expect(summary.boardId).toBe(board.id);
            expect(summary.totalCards).toBe(0);
            expect(summary.cardsByColumn).toEqual([]);
            expect(summary.cardsByPriority).toEqual([]);
            expect(summary.totalTags).toBe(0);
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
    });
});
