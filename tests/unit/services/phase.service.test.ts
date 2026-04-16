import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BoardService } from '../../../src/lib/server/services/board.service.js';
import { ColumnService } from '../../../src/lib/server/services/column.service.js';
import { CardService } from '../../../src/lib/server/services/card.service.js';
import { PhaseService } from '../../../src/lib/server/services/phase.service.js';
import { NotFoundError, ValidationError, ConflictError } from '../../../src/lib/server/errors.js';

describe('PhaseService', () => {
    let boardService: BoardService;
    let columnService: ColumnService;
    let cardService: CardService;
    let phaseService: PhaseService;
    let boardId: string;
    let columnId: string;
    let cardId: string;

    beforeEach(() => {
        const { db } = createTestDb();
        boardService = new BoardService(db);
        columnService = new ColumnService(db);
        cardService = new CardService(db);
        phaseService = new PhaseService(db);
        const board = boardService.createBoard({ name: 'Test Board' });
        boardId = board.id;
        const col = columnService.create({ boardId, name: 'To Do' });
        columnId = col.id;
        const card = cardService.create({ columnId, title: 'Test Card' });
        cardId = card.id;
    });

    describe('create', () => {
        it('creates a phase with valid input', () => {
            const phase = phaseService.create({ boardId, name: 'Code Review' });
            expect(phase.id).toBeDefined();
            expect(phase.name).toBe('Code Review');
            expect(phase.boardId).toBe(boardId);
            expect(phase.color).toBe('#00FFFF');
            expect(phase.position).toBe(1.0);
            expect(phase.createdAt).toBeDefined();
            expect(phase.updatedAt).toBeDefined();
        });

        it('creates a phase with custom color', () => {
            const phase = phaseService.create({ boardId, name: 'QA', color: '#FF00FF' });
            expect(phase.color).toBe('#FF00FF');
        });

        it('trims the name', () => {
            const phase = phaseService.create({ boardId, name: '  Code Review  ' });
            expect(phase.name).toBe('Code Review');
        });

        it('auto-increments position', () => {
            const p1 = phaseService.create({ boardId, name: 'Dev' });
            const p2 = phaseService.create({ boardId, name: 'QA' });
            const p3 = phaseService.create({ boardId, name: 'Deploy' });
            expect(p1.position).toBe(1.0);
            expect(p2.position).toBe(2.0);
            expect(p3.position).toBe(3.0);
        });

        it('throws ValidationError for empty name', () => {
            expect(() => phaseService.create({ boardId, name: '' })).toThrow(ValidationError);
        });

        it('throws ValidationError for whitespace-only name', () => {
            expect(() => phaseService.create({ boardId, name: '   ' })).toThrow(ValidationError);
        });

        it('throws ValidationError for name > 50 chars', () => {
            expect(() => phaseService.create({ boardId, name: 'a'.repeat(51) })).toThrow(ValidationError);
        });

        it('throws ValidationError for invalid hex color', () => {
            expect(() => phaseService.create({ boardId, name: 'Dev', color: 'red' })).toThrow(ValidationError);
            expect(() => phaseService.create({ boardId, name: 'Dev', color: '#ZZZ' })).toThrow(ValidationError);
            expect(() => phaseService.create({ boardId, name: 'Dev', color: '#12345' })).toThrow(ValidationError);
        });

        it('throws NotFoundError for unknown board', () => {
            expect(() => phaseService.create({ boardId: 'nonexistent', name: 'Dev' })).toThrow(NotFoundError);
        });

        it('throws ConflictError for duplicate name on same board', () => {
            phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.create({ boardId, name: 'Dev' })).toThrow(ConflictError);
        });

        it('allows same name on different boards', () => {
            const board2 = boardService.createBoard({ name: 'Board 2' });
            phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.create({ boardId: board2.id, name: 'Dev' })).not.toThrow();
        });
    });

    describe('listByBoard', () => {
        it('returns empty array for unknown boardId', () => {
            expect(phaseService.listByBoard('nonexistent')).toEqual([]);
        });

        it('returns empty array when no phases exist', () => {
            expect(phaseService.listByBoard(boardId)).toEqual([]);
        });

        it('returns phases ordered by position ASC', () => {
            phaseService.create({ boardId, name: 'QA' });
            phaseService.create({ boardId, name: 'Dev' });
            phaseService.create({ boardId, name: 'Deploy' });
            const list = phaseService.listByBoard(boardId);
            expect(list).toHaveLength(3);
            expect(list[0].name).toBe('QA');
            expect(list[1].name).toBe('Dev');
            expect(list[2].name).toBe('Deploy');
        });

        it('only returns phases for the requested board', () => {
            const board2 = boardService.createBoard({ name: 'Board 2' });
            phaseService.create({ boardId, name: 'Dev' });
            phaseService.create({ boardId: board2.id, name: 'QA' });
            expect(phaseService.listByBoard(boardId)).toHaveLength(1);
            expect(phaseService.listByBoard(board2.id)).toHaveLength(1);
        });
    });

    describe('getById', () => {
        it('returns a phase by id', () => {
            const created = phaseService.create({ boardId, name: 'Dev' });
            const fetched = phaseService.getById(created.id);
            expect(fetched.id).toBe(created.id);
            expect(fetched.name).toBe('Dev');
        });

        it('throws NotFoundError for unknown id', () => {
            expect(() => phaseService.getById('nonexistent')).toThrow(NotFoundError);
        });
    });

    describe('update', () => {
        it('updates phase name', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            const updated = phaseService.update(phase.id, { name: 'Development' });
            expect(updated.name).toBe('Development');
        });

        it('updates phase color', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            const updated = phaseService.update(phase.id, { color: '#FF0040' });
            expect(updated.color).toBe('#FF0040');
        });

        it('trims the updated name', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            const updated = phaseService.update(phase.id, { name: '  QA  ' });
            expect(updated.name).toBe('QA');
        });

        it('updates updatedAt timestamp', async () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            await new Promise((r) => setTimeout(r, 10));
            const updated = phaseService.update(phase.id, { name: 'QA' });
            expect(updated.updatedAt).not.toBe(phase.updatedAt);
        });

        it('throws NotFoundError for unknown id', () => {
            expect(() => phaseService.update('nonexistent', { name: 'X' })).toThrow(NotFoundError);
        });

        it('throws ValidationError for empty name', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.update(phase.id, { name: '' })).toThrow(ValidationError);
        });

        it('throws ValidationError for name > 50 chars', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.update(phase.id, { name: 'a'.repeat(51) })).toThrow(ValidationError);
        });

        it('throws ValidationError for invalid color', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.update(phase.id, { color: 'invalid' })).toThrow(ValidationError);
        });

        it('throws ConflictError when renaming to existing name', () => {
            const p1 = phaseService.create({ boardId, name: 'Dev' });
            phaseService.create({ boardId, name: 'QA' });
            expect(() => phaseService.update(p1.id, { name: 'QA' })).toThrow(ConflictError);
        });

        it('allows renaming to own name (no-op)', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.update(phase.id, { name: 'Dev' })).not.toThrow();
        });
    });

    describe('delete', () => {
        it('deletes a phase', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            phaseService.delete(phase.id);
            expect(phaseService.listByBoard(boardId)).toHaveLength(0);
        });

        it('throws NotFoundError for unknown id', () => {
            expect(() => phaseService.delete('nonexistent')).toThrow(NotFoundError);
        });

        it('sets assigned cards phaseId to NULL on delete (FK cascade)', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            cardService.update(cardId, { phaseId: phase.id });
            phaseService.delete(phase.id);
            const card = cardService.getById(cardId);
            expect(card.phase).toBeNull();
        });
    });

    describe('reorder', () => {
        it('assigns new positions to phases', () => {
            const p1 = phaseService.create({ boardId, name: 'Dev' });
            const p2 = phaseService.create({ boardId, name: 'QA' });
            const p3 = phaseService.create({ boardId, name: 'Deploy' });
            // Reverse order
            const result = phaseService.reorder(boardId, [p3.id, p2.id, p1.id]);
            expect(result[0].id).toBe(p3.id);
            expect(result[1].id).toBe(p2.id);
            expect(result[2].id).toBe(p1.id);
            expect(result[0].position).toBeLessThan(result[1].position);
            expect(result[1].position).toBeLessThan(result[2].position);
        });

        it('throws NotFoundError for unknown board', () => {
            expect(() => phaseService.reorder('nonexistent', [])).toThrow(NotFoundError);
        });

        it('throws ValidationError when orderedIds length mismatches phase count', () => {
            phaseService.create({ boardId, name: 'Dev' });
            phaseService.create({ boardId, name: 'QA' });
            expect(() => phaseService.reorder(boardId, ['one'])).toThrow(ValidationError);
        });

        it('throws ValidationError when orderedIds contain IDs not belonging to the board', () => {
            phaseService.create({ boardId, name: 'Dev' });
            expect(() => phaseService.reorder(boardId, ['fake-id'])).toThrow(ValidationError);
        });
    });
});
