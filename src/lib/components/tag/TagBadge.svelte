<script lang="ts">
    import type { Tag } from '$lib/types/board.js';
    import { hexToRgb } from '$lib/utils/color.js';

    let { tag, removable = false, onremove }: {
        tag: Tag;
        removable?: boolean;
        onremove?: (id: string) => void;
    } = $props();

    const rgb = $derived(hexToRgb(tag.color.startsWith('#') ? tag.color : '#6366f1'));
</script>

<span
    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
    style="
        color: {tag.color};
        background: rgba({rgb}, 0.15);
        border: 1px solid rgba({rgb}, 0.4);
    "
>
    {tag.name}
    {#if removable}
        <button
            class="hover:opacity-80 leading-none ml-0.5"
            style="color: {tag.color};"
            onclick={(e: MouseEvent) => { e.stopPropagation(); onremove?.(tag.id); }}
            title="Remove tag"
        >
            ×
        </button>
    {/if}
</span>
