<script lang="ts">
    import type { Tag } from '$lib/types/board.js';

    export let tag: Tag;
    export let removable = false;
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function hexToRgb(hex: string): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    $: rgb = hexToRgb(tag.color.startsWith('#') ? tag.color : '#6366f1');
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
            on:click|stopPropagation={() => dispatch('remove', tag.id)}
            title="Remove tag"
        >
            ×
        </button>
    {/if}
</span>
