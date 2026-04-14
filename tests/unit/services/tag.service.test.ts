import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../helpers/db.js';
import { BoardService } from '../../../src/lib/server/services/board.service.js';
import { ColumnService } from '../../../src/lib/server/services/column.service.js';
import { CardService } from '../../../src/lib/server/services/card.service.js';
import { TagService } from '../../../src/lib/server/services/tag.service.js';
import { NotFoundError, ValidationError, ConflictError } from '../../../src/lib/server/errors.js';

describe('TagService', () => {
    let boardService: BoardService;
    let columnService: ColumnService;
    let cardService: CardService;
    let tagService: TagService;
    let boardId: string;
    let columnId: string;
    let cardId: string;

    beforeEach(() => {
        const { db } = createTestDb();
        boardService = new BoardService(db);
        columnService = new ColumnService(db);
        cardService = new CardService(db);
        tagService = new TagService(db);
        const board = boardService.createBoard({ name: 'Test Board' });
        boardId = board.id;
        const col = columnService.create({ boardId, name: 'To Do' });
        columnId = col.id;
        const card = cardService.create({ columnId, title: 'Test Card' });
        cardId = card.id;
    });

    describe('create', () => {
        it('creates a tag with valid input', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            expect(tag.id).toBeDefined();
            expect(tag.name).toBe('Bug');
            expect(tag.boardId).toBe(boardId);
            expect(tag.color).toBe('#3b82f6');
        });

        it('creates a tag with custom color', () => {
            const tag = tagService.create({ boardId, name: 'Feature', color: '#ff0000' });
            expect(tag.color).toBe('#ff0000');
        });

        it('throws ValidationError for empty name', () => {
            expect(() => tagService.create({ boardId, name: '' })).toThrow(ValidationError);
        });

        it('throws ValidationError for name > 50 chars', () => {
            expect(() => tagService.create({ boardId, name: 'a'.repeat(51) })).toThrow(ValidationError);
        });

        it('throws NotFoundError for unknown board', () => {
            expect(() => tagService.create({ boardId: 'nonexistent', name: 'Tag' })).toThrow(NotFoundError);
        });

        it('throws ConflictError for duplicate name on same board', () => {
            tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.create({ boardId, name: 'Bug' })).toThrow(ConflictError);
        });

        it('allows same name on different boards', () => {
            const board2 = boardService.createBoard({ name: 'Board 2' });
            tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.create({ boardId: board2.id, name: 'Bug' })).not.toThrow();
        });
    });

    describe('listByBoard', () => {
        it('returns empty array when no tags', () => {
            expect(tagService.listByBoard(boardId)).toEqual([]);
        });

        it('returns all tags for the board', () => {
            tagService.create({ boardId, name: 'Bug' });
            tagService.create({ boardId, name: 'Feature' });
            const list = tagService.listByBoard(boardId);
            expect(list).toHaveLength(2);
        });
    });

    describe('update', () => {
        it('updates tag name', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            const updated = tagService.update(tag.id, { name: 'Defect' });
            expect(updated.name).toBe('Defect');
        });

        it('throws NotFoundError for unknown tag', () => {
            expect(() => tagService.update('nonexistent', { name: 'X' })).toThrow(NotFoundError);
        });

        it('throws ConflictError when renaming to existing name', () => {
            const tag1 = tagService.create({ boardId, name: 'Bug' });
            tagService.create({ boardId, name: 'Feature' });
            expect(() => tagService.update(tag1.id, { name: 'Feature' })).toThrow(ConflictError);
        });

        it('allows renaming to own name (no-op name change)', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.update(tag.id, { name: 'Bug' })).not.toThrow();
        });
    });

    describe('delete', () => {
        it('deletes a tag', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.delete(tag.id)).not.toThrow();
            expect(tagService.listByBoard(boardId)).toHaveLength(0);
        });

        it('throws NotFoundError for unknown tag', () => {
            expect(() => tagService.delete('nonexistent')).toThrow(NotFoundError);
        });
    });

    describe('assignToCard and removeFromCard', () => {
        it('assigns a tag to a card', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.assignToCard(cardId, tag.id)).not.toThrow();
        });

        it('is idempotent — assigning twice does not throw', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            tagService.assignToCard(cardId, tag.id);
            expect(() => tagService.assignToCard(cardId, tag.id)).not.toThrow();
        });

        it('removes a tag from a card', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            tagService.assignToCard(cardId, tag.id);
            expect(() => tagService.removeFromCard(cardId, tag.id)).not.toThrow();
        });

        it('removeFromCard is idempotent — removing non-assigned tag does not throw', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.removeFromCard(cardId, tag.id)).not.toThrow();
        });

        it('throws NotFoundError when assigning to unknown card', () => {
            const tag = tagService.create({ boardId, name: 'Bug' });
            expect(() => tagService.assignToCard('nonexistent', tag.id)).toThrow(NotFoundError);
        });

        it('throws NotFoundError when assigning unknown tag', () => {
            expect(() => tagService.assignToCard(cardId, 'nonexistent')).toThrow(NotFoundError);
        });
    });
});
