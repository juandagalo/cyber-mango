/**
 * Converts a 6-digit hex color string to an "R,G,B" string
 * suitable for use in rgba() CSS values.
 * Falls back gracefully if the input is not a valid hex string.
 */
export function hexToRgb(hex: string): string {
    const h = hex.startsWith('#') ? hex : `#${hex}`;
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `${r},${g},${b}`;
}
