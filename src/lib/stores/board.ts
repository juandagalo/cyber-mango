import { writable } from 'svelte/store';
import type { BoardWithColumns, CardWithTags } from '$lib/types/board.js';

export const boardStore = writable<BoardWithColumns | null>(null);

export function updateCardInStore(cardId: string, updates: Partial<CardWithTags>) {
    boardStore.update(board => {
        if (!board) return board;
        for (const col of board.columns) {
            const cardIdx = col.cards.findIndex(c => c.id === cardId);
            if (cardIdx !== -1) {
                col.cards[cardIdx] = { ...col.cards[cardIdx], ...updates };
                break;
            }
        }
        return { ...board };
    });
}

export function removeCardFromStore(cardId: string) {
    boardStore.update(board => {
        if (!board) return board;
        for (const col of board.columns) {
            col.cards = col.cards.filter(c => c.id !== cardId);
        }
        return { ...board };
    });
}

export function addCardToStore(columnId: string, card: CardWithTags) {
    boardStore.update(board => {
        if (!board) return board;
        const col = board.columns.find(c => c.id === columnId);
        if (col) {
            col.cards.push(card);
            col.cards.sort((a, b) => a.position - b.position);
        }
        return { ...board };
    });
}

export function moveCardInStore(
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    newPosition: number
) {
    boardStore.update(board => {
        if (!board) return board;

        let card: CardWithTags | undefined;
        const fromCol = board.columns.find(c => c.id === fromColumnId);
        if (fromCol) {
            const idx = fromCol.cards.findIndex(c => c.id === cardId);
            if (idx !== -1) {
                card = { ...fromCol.cards[idx], columnId: toColumnId, position: newPosition };
                fromCol.cards.splice(idx, 1);
            }
        }

        if (card) {
            const toCol = board.columns.find(c => c.id === toColumnId);
            if (toCol) {
                toCol.cards.push(card);
                toCol.cards.sort((a, b) => a.position - b.position);
            }
        }

        return { ...board };
    });
}
