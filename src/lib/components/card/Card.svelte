<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { CardWithTags } from '$lib/types/board.js';
    import PriorityBadge from './PriorityBadge.svelte';
    import TagBadge from '$lib/components/tag/TagBadge.svelte';

    export let card: CardWithTags;

    const dispatch = createEventDispatcher();

    const priorityColors: Record<string, string> = {
        critical: '#FF0040',
        high: '#FF00FF',
        medium: '#00FFFF',
        low: '#404060'
    };

    const priorityGlows: Record<string, string> = {
        critical: 'rgba(255,0,64,0.4)',
        high: 'rgba(255,0,255,0.3)',
        medium: 'rgba(0,255,255,0.3)',
        low: 'rgba(64,64,96,0.2)'
    };

    $: borderColor = priorityColors[card.priority] ?? '#404060';
    $: glowColor = priorityGlows[card.priority] ?? 'transparent';
    $: visibleTags = card.tags.slice(0, 3);
    $: extraTagCount = card.tags.length - 3;

    let hovered = false;

    function handleClick() {
        dispatch('open', card);
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
    class="rounded cursor-pointer select-none transition-all duration-150 px-3 py-2.5"
    style="
        background: #1a1a2e;
        border-left: 2px solid {borderColor};
        {hovered ? `box-shadow: -2px 0 8px ${glowColor}, 0 0 12px ${glowColor};` : 'box-shadow: none;'}
    "
    on:mouseenter={() => (hovered = true)}
    on:mouseleave={() => (hovered = false)}
    on:click={handleClick}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
    <div class="flex flex-col gap-1.5">
        <p class="text-[#e0e0e0] text-sm font-mono leading-snug break-words">{card.title}</p>

        <div class="flex items-center justify-between gap-2 flex-wrap">
            <PriorityBadge priority={card.priority} />

            {#if card.tags.length > 0}
                <div class="flex items-center gap-1 flex-wrap">
                    {#each visibleTags as tag (tag.id)}
                        <TagBadge {tag} />
                    {/each}
                    {#if extraTagCount > 0}
                        <span class="text-[10px] text-[#808090] font-mono">+{extraTagCount}</span>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
