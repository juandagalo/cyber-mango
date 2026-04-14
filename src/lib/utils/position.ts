export const POSITION_GAP = 1.0;
export const POSITION_EPSILON = 1e-10;

export function midpoint(a: number, b: number): number {
    return (a + b) / 2;
}

export function getInsertPosition(
    existingPositions: number[], // sorted ascending
    targetIndex: number // 0-based index where new item should go
): { position: number; needsReindex: boolean } {
    if (existingPositions.length === 0) {
        return { position: POSITION_GAP, needsReindex: false };
    }

    // Insert at the beginning
    if (targetIndex <= 0) {
        const first = existingPositions[0];
        const pos = first - POSITION_GAP;
        return { position: pos > 0 ? pos : midpoint(0, first), needsReindex: false };
    }

    // Insert at the end
    if (targetIndex >= existingPositions.length) {
        return { position: existingPositions[existingPositions.length - 1] + POSITION_GAP, needsReindex: false };
    }

    // Insert between
    const before = existingPositions[targetIndex - 1];
    const after = existingPositions[targetIndex];
    const gap = after - before;

    if (gap < POSITION_EPSILON) {
        return { position: midpoint(before, after), needsReindex: true };
    }

    return { position: midpoint(before, after), needsReindex: false };
}

export function generatePositions(count: number, gap: number = POSITION_GAP): number[] {
    return Array.from({ length: count }, (_, i) => (i + 1) * gap);
}
