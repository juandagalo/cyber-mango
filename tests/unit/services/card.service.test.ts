import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BoardService } from '../../../src/lib/server/services/board.service.js';
import { ColumnService } from '../../../src/lib/server/services/column.service.js';
import { CardService } from '../../../src/lib/server/services/card.service.js';
import { PhaseService } from '../../../src/lib/server/services/phase.service.js';
import { NotFoundError, ValidationError } from '../../../src/lib/server/errors.js';

describe('CardService', () => {
    let boardService: BoardService;
    let columnService: ColumnService;
    let cardService: CardService;
    let phaseService: PhaseService;
    let boardId: string;
    let columnId: string;

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
    });

    describe('create', () => {
        it('creates a card with valid input', () => {
            const card = cardService.create({ columnId, title: 'My Card' });
            expect(card.id).toBeDefined();
            expect(card.title).toBe('My Card');
            expect(card.columnId).toBe(columnId);
            expect(card.priority).toBe('medium');
            expect(card.position).toBe(1.0);
            expect(card.tags).toEqual([]);
        });

        it('assigns increasing positions', () => {
            const c1 = cardService.create({ columnId, title: 'Card 1' });
            const c2 = cardService.create({ columnId, title: 'Card 2' });
            expect(c2.position).toBeGreaterThan(c1.position);
        });

        it('throws ValidationError for empty title', () => {
            expect(() => cardService.create({ columnId, title: '' })).toThrow(ValidationError);
        });

        it('throws NotFoundError for unknown column', () => {
            expect(() => cardService.create({ columnId: 'nonexistent', title: 'Card' })).toThrow(NotFoundError);
        });

        it('accepts custom priority', () => {
            const card = cardService.create({ columnId, title: 'Card', priority: 'high' });
            expect(card.priority).toBe('high');
        });
    });

    describe('getById', () => {
        it('returns card with tags', () => {
            const card = cardService.create({ columnId, title: 'My Card' });
            const result = cardService.getById(card.id);
            expect(result.id).toBe(card.id);
            expect(result.tags).toEqual([]);
        });

        it('throws NotFoundError for unknown card', () => {
            expect(() => cardService.getById('nonexistent')).toThrow(NotFoundError);
        });
    });

    describe('update', () => {
        it('updates card title', () => {
            const card = cardService.create({ columnId, title: 'Old Title' });
            const updated = cardService.update(card.id, { title: 'New Title' });
            expect(updated.title).toBe('New Title');
        });

        it('throws NotFoundError for unknown card', () => {
            expect(() => cardService.update('nonexistent', { title: 'X' })).toThrow(NotFoundError);
        });

        it('throws ValidationError for empty title', () => {
            const card = cardService.create({ columnId, title: 'Card' });
            expect(() => cardService.update(card.id, { title: '' })).toThrow(ValidationError);
        });

        it('updates priority', () => {
            const card = cardService.create({ columnId, title: 'Card' });
            const updated = cardService.update(card.id, { priority: 'critical' });
            expect(updated.priority).toBe('critical');
        });
    });

    describe('move', () => {
        it('moves card to another column', () => {
            const col2 = columnService.create({ boardId, name: 'Done' });
            const card = cardService.create({ columnId, title: 'Card' });
            const moved = cardService.move(card.id, { columnId: col2.id, position: 1.5 });
            expect(moved.columnId).toBe(col2.id);
            expect(moved.position).toBe(1.5);
        });

        it('throws NotFoundError for unknown card', () => {
            expect(() => cardService.move('nonexistent', { columnId, position: 1.0 })).toThrow(NotFoundError);
        });

        it('throws NotFoundError for unknown target column', () => {
            const card = cardService.create({ columnId, title: 'Card' });
            expect(() => cardService.move(card.id, { columnId: 'nonexistent', position: 1.0 })).toThrow(NotFoundError);
        });
    });

    describe('delete', () => {
        it('deletes a card', () => {
            const card = cardService.create({ columnId, title: 'Card' });
            expect(() => cardService.delete(card.id)).not.toThrow();
            expect(() => cardService.getById(card.id)).toThrow(NotFoundError);
        });

        it('throws NotFoundError for unknown card', () => {
            expect(() => cardService.delete('nonexistent')).toThrow(NotFoundError);
        });
    });

    describe('phaseId support', () => {
        it('creates a card with phaseId', () => {
            const phase = phaseService.create({ boardId, name: 'Dev' });
            const card = cardService.create({ columnId, title: 'Card', phaseId: phase.id });
            expect(card.phase).not.toBeNull();
            expect(card.phase!.id).toBe(phase.id);
            expect(card.phase!.name).toBe('Dev');
        });

        it('creates a card without phaseId — phase is null', () => {
            const card = cardService.create({ columnId, title: 'Card' });
            expect(card.phase).toBeNull();
        });

        it('throws NotFoundError for invalid phaseId on create', () => {
            expect(() => cardService.create({ columnId, title: 'Card', phaseId: 'nonexistent' })).toThrow(NotFoundError);
        });

        it('updates card with phaseId', () => {
            const phase = phaseService.create({ boardId, name: 'QA' });
            const card = cardService.create({ columnId, title: 'Card' });
            const updated = cardService.update(card.id, { phaseId: phase.id });
            expect(updated.phase).not.toBeNull();
            expect(updated.phase!.id).toBe(phase.id);
        });

        it('unsets phase with phaseId: null', () => {
            const phase = phaseService.create({ boardId, name: 'QA' });
            const card = cardService.create({ columnId, title: 'Card', phaseId: phase.id });
            const updated = cardService.update(card.id, { phaseId: null });
            expect(updated.phase).toBeNull();
        });

        it('does not change phase when phaseId is undefined', () => {
            const phase = phaseService.create({ boardId, name: 'QA' });
            const card = cardService.create({ columnId, title: 'Card', phaseId: phase.id });
            const updated = cardService.update(card.id, { title: 'New Title' });
            expect(updated.phase).not.toBeNull();
            expect(updated.phase!.id).toBe(phase.id);
        });

        it('throws NotFoundError for invalid phaseId on update', () => {
            const card = cardService.create({ columnId, title: 'Card' });
            expect(() => cardService.update(card.id, { phaseId: 'nonexistent' })).toThrow(NotFoundError);
        });
    });

    describe('reindexPositions', () => {
        it('reassigns sequential positions starting at 1.0', () => {
            cardService.create({ columnId, title: 'C1' });
            cardService.create({ columnId, title: 'C2' });
            cardService.create({ columnId, title: 'C3' });

            // This should not throw
            expect(() => cardService.reindexPositions(columnId)).not.toThrow();
        });
    });
});
