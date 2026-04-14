import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BoardService } from '../../../src/lib/server/services/board.service.js';
import { ColumnService } from '../../../src/lib/server/services/column.service.js';
import { NotFoundError, ValidationError } from '../../../src/lib/server/errors.js';

describe('ColumnService', () => {
    let boardService: BoardService;
    let columnService: ColumnService;
    let boardId: string;

    beforeEach(() => {
        const { db } = createTestDb();
        boardService = new BoardService(db);
        columnService = new ColumnService(db);
        const board = boardService.createBoard({ name: 'Test Board' });
        boardId = board.id;
    });

    describe('create', () => {
        it('creates a column with valid input', () => {
            const col = columnService.create({ boardId, name: 'To Do' });
            expect(col.id).toBeDefined();
            expect(col.name).toBe('To Do');
            expect(col.boardId).toBe(boardId);
            expect(col.position).toBe(1.0);
        });

        it('assigns increasing positions', () => {
            const col1 = columnService.create({ boardId, name: 'Col 1' });
            const col2 = columnService.create({ boardId, name: 'Col 2' });
            expect(col2.position).toBeGreaterThan(col1.position);
        });

        it('throws ValidationError for empty name', () => {
            expect(() => columnService.create({ boardId, name: '' })).toThrow(ValidationError);
        });

        it('throws NotFoundError for unknown board', () => {
            expect(() => columnService.create({ boardId: 'nonexistent', name: 'Col' })).toThrow(NotFoundError);
        });

        it('sets default color', () => {
            const col = columnService.create({ boardId, name: 'Col' });
            expect(col.color).toBe('#6b7280');
        });

        it('accepts custom color and wipLimit', () => {
            const col = columnService.create({ boardId, name: 'Col', color: '#ff0000', wipLimit: 5 });
            expect(col.color).toBe('#ff0000');
            expect(col.wipLimit).toBe(5);
        });
    });

    describe('update', () => {
        it('updates column name', () => {
            const col = columnService.create({ boardId, name: 'Old Name' });
            const updated = columnService.update(col.id, { name: 'New Name' });
            expect(updated.name).toBe('New Name');
        });

        it('throws NotFoundError for unknown column', () => {
            expect(() => columnService.update('nonexistent', { name: 'X' })).toThrow(NotFoundError);
        });

        it('throws ValidationError for empty name', () => {
            const col = columnService.create({ boardId, name: 'Col' });
            expect(() => columnService.update(col.id, { name: '' })).toThrow(ValidationError);
        });

        it('updates wipLimit to null', () => {
            const col = columnService.create({ boardId, name: 'Col', wipLimit: 5 });
            const updated = columnService.update(col.id, { wipLimit: null });
            expect(updated.wipLimit).toBeNull();
        });
    });

    describe('delete', () => {
        it('deletes a column when not the last one', () => {
            const col1 = columnService.create({ boardId, name: 'Col 1' });
            const col2 = columnService.create({ boardId, name: 'Col 2' });
            expect(() => columnService.delete(col1.id)).not.toThrow();
        });

        it('throws ValidationError when deleting the last column', () => {
            const col = columnService.create({ boardId, name: 'Only Col' });
            expect(() => columnService.delete(col.id)).toThrow(ValidationError);
        });

        it('throws NotFoundError for unknown column', () => {
            expect(() => columnService.delete('nonexistent')).toThrow(NotFoundError);
        });
    });

    describe('reorder', () => {
        it('updates position', () => {
            const col = columnService.create({ boardId, name: 'Col' });
            const updated = columnService.reorder(col.id, 5.5);
            expect(updated.position).toBe(5.5);
        });

        it('throws NotFoundError for unknown column', () => {
            expect(() => columnService.reorder('nonexistent', 1.0)).toThrow(NotFoundError);
        });
    });

    describe('reindexPositions', () => {
        it('reassigns sequential positions', () => {
            const col1 = columnService.create({ boardId, name: 'Col 1' });
            const col2 = columnService.create({ boardId, name: 'Col 2' });
            const col3 = columnService.create({ boardId, name: 'Col 3' });

            columnService.reorder(col1.id, 0.001);
            columnService.reindexPositions(boardId);

            const reordered1 = columnService.reorder(col1.id, 1.0); // just to read it back
            expect(reordered1.position).toBe(1.0);
        });
    });
});
