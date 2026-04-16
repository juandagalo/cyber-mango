<script lang="ts">
    import type { Phase } from '$lib/types/board.js';

    let { phase }: { phase: Phase } = $props();

    function hexToRgb(hex: string): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    const rgb = $derived(hexToRgb(phase.color.startsWith('#') ? phase.color : '#00FFFF'));
</script>

<span
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
    style="
        background: rgba({rgb}, 0.10);
        border: 1px solid rgba({rgb}, 0.35);
    "
>
    <span
        class="w-2 h-2 rounded-full flex-shrink-0"
        style="background: {phase.color}; box-shadow: 0 0 4px {phase.color};"
    ></span>
    <span
        class="text-[10px] font-mono font-semibold uppercase tracking-wider"
        style="color: {phase.color};"
    >
        {phase.name}
    </span>
</span>
