<script lang="ts">
    import type { CardWithTags } from '$lib/types/board.js';
    import PriorityBadge from './PriorityBadge.svelte';
    import PhaseBadge from './PhaseBadge.svelte';
    import TagBadge from '$lib/components/tag/TagBadge.svelte';

    let { card, onopen }: {
        card: CardWithTags;
        onopen?: (card: CardWithTags) => void;
    } = $props();

    const priorityColors: Record<string, string> = {
        critical: '#FF003C',
        high: '#ED1E79',
        medium: '#FCEE0A',
        low: '#6A6A7A'
    };

    const priorityGlows: Record<string, string> = {
        critical: 'rgba(255,0,60,0.4)',
        high: 'rgba(237,30,121,0.3)',
        medium: 'rgba(252,238,10,0.2)',
        low: 'transparent'
    };

    const borderColor = $derived(priorityColors[card.priority] ?? '#6A6A7A');
    const glowColor = $derived(priorityGlows[card.priority] ?? 'transparent');
    const visibleTags = $derived(card.tags.slice(0, 3));
    const extraTagCount = $derived(card.tags.length - 3);

    function handleClick() {
        onopen?.(card);
    }
</script>

<div
    class="cursor-pointer select-none transition-all duration-150 px-3 py-2.5 corner-brackets hover-sweep card-hoverable"
    style="border-left: 2px solid {borderColor}; --glow-color: {glowColor};"
    onclick={handleClick}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
    <div class="flex flex-col gap-1.5">
        <p class="text-sm font-rajdhani font-semibold leading-snug break-words text-cyber-primary">{card.title}</p>

        <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-1.5">
                <PriorityBadge priority={card.priority} />
                {#if card.phase}
                    <PhaseBadge phase={card.phase} />
                {/if}
            </div>

            {#if card.tags.length > 0}
                <div class="flex items-center gap-1 flex-wrap">
                    {#each visibleTags as tag (tag.id)}
                        <TagBadge {tag} />
                    {/each}
                    {#if extraTagCount > 0}
                        <span class="text-[10px] font-mono text-cyber-muted">+{extraTagCount}</span>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
