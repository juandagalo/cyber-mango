import { describe, it, expect } from 'vitest';
import { midpoint, getInsertPosition, generatePositions, POSITION_GAP } from '$lib/utils/position.js';

describe('position utilities', () => {
    describe('midpoint', () => {
        it('calculates midpoint of two numbers', () => {
            expect(midpoint(1.0, 2.0)).toBe(1.5);
            expect(midpoint(0, 10)).toBe(5);
            expect(midpoint(1.0, 1.5)).toBe(1.25);
        });
    });

    describe('getInsertPosition', () => {
        it('returns default gap for empty list', () => {
            const result = getInsertPosition([], 0);
            expect(result.position).toBe(POSITION_GAP);
            expect(result.needsReindex).toBe(false);
        });

        it('inserts before first item', () => {
            const result = getInsertPosition([1.0, 2.0, 3.0], 0);
            expect(result.position).toBeLessThan(1.0);
            expect(result.needsReindex).toBe(false);
        });

        it('inserts after last item', () => {
            const result = getInsertPosition([1.0, 2.0, 3.0], 3);
            expect(result.position).toBeGreaterThan(3.0);
            expect(result.needsReindex).toBe(false);
        });

        it('inserts between items', () => {
            const result = getInsertPosition([1.0, 2.0, 3.0], 1);
            expect(result.position).toBeGreaterThan(1.0);
            expect(result.position).toBeLessThan(2.0);
            expect(result.position).toBe(1.5);
            expect(result.needsReindex).toBe(false);
        });

        it('flags reindex needed when gap is too small', () => {
            const a = 1.0;
            const b = a + 1e-11; // below epsilon
            const result = getInsertPosition([a, b], 1);
            expect(result.needsReindex).toBe(true);
        });
    });

    describe('generatePositions', () => {
        it('generates sequential positions', () => {
            expect(generatePositions(5)).toEqual([1.0, 2.0, 3.0, 4.0, 5.0]);
        });

        it('uses custom gap', () => {
            expect(generatePositions(3, 10)).toEqual([10, 20, 30]);
        });
    });
});
