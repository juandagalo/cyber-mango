<script lang="ts">
    import { untrack } from 'svelte';
    import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
    import type { ColumnWithCards, CardWithTags } from '$lib/types/board.js';
    import Card from '$lib/components/card/Card.svelte';
    import CardQuickAdd from '$lib/components/card/CardQuickAdd.svelte';
    import EmptyState from '$lib/components/ui/EmptyState.svelte';
    import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
    import { boardStore, moveCardInStore } from '$lib/stores/board.js';
    import { addToast } from '$lib/stores/toast.js';

    let { column, onrefresh, onopencard }: {
        column: ColumnWithCards;
        onrefresh?: () => void;
        onopencard?: (card: CardWithTags) => void;
    } = $props();

    // Local items for DnD
    let items = $state<CardWithTags[]>(untrack(() => [...column.cards]));
    $effect(() => {
        items = [...column.cards];
    });

    // Menu state
    let menuOpen = $state(false);
    let showConfirmDelete = $state(false);
    let deletingColumn = $state(false);

    // Rename state
    let renaming = $state(false);
    let renameValue = $state('');
    let renameInput = $state<HTMLInputElement | undefined>(undefined);

    // Color picker state
    let editingColor = $state(false);
    let colorValue = $state(untrack(() => column.color ?? '#00FFFF'));

    // WIP limit state
    let editingWip = $state(false);
    let wipValue = $state(untrack(() => column.wipLimit?.toString() ?? ''));

    // Derived
    const wipExceeded = $derived(column.wipLimit !== null && column.cards.length > column.wipLimit);
    const defaultColor = '#00FFFF';
    const headerColor = $derived(column.color ?? defaultColor);

    // DnD handlers
    function handleDndConsider(e: CustomEvent<{ items: CardWithTags[] }>) {
        items = e.detail.items;
    }

    async function handleDndFinalize(e: CustomEvent<{ items: CardWithTags[]; info: { id: string; source: string; trigger: string } }>) {
        const newItems = e.detail.items.filter(
            (item: CardWithTags) => !(item as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]
        );
        items = newItems;

        const movedCard = e.detail.items.find(
            (item: CardWithTags) => item.id === e.detail.info.id
        );
        if (!movedCard) return;

        const newIdx = newItems.findIndex(c => c.id === movedCard.id);
        const prev = newItems[newIdx - 1];
        const next = newItems[newIdx + 1];

        let newPosition: number;
        if (!prev && !next) {
            newPosition = 1000;
        } else if (!prev) {
            newPosition = next.position / 2;
        } else if (!next) {
            newPosition = prev.position + 1000;
        } else {
            newPosition = (prev.position + next.position) / 2;
        }

        const originalColumnId = movedCard.columnId;
        const targetColumnId = column.id;

        moveCardInStore(movedCard.id, originalColumnId, targetColumnId, newPosition);

        try {
            const res = await fetch(`/api/cards/${movedCard.id}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columnId: targetColumnId, position: newPosition })
            });
            if (!res.ok) {
                addToast('Failed to move card — reverting');
                onrefresh?.();
            }
        } catch {
            addToast('Failed to move card — reverting');
            onrefresh?.();
        }
    }

    // Rename column
    function startRename() {
        renameValue = column.name;
        renaming = true;
        menuOpen = false;
        setTimeout(() => renameInput?.focus(), 50);
    }

    async function submitRename() {
        const name = renameValue.trim();
        if (!name || name === column.name) {
            renaming = false;
            return;
        }
        try {
            const res = await fetch(`/api/columns/${column.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!res.ok) {
                addToast('Failed to rename column');
            } else {
                onrefresh?.();
            }
        } catch {
            addToast('Failed to rename column');
        }
        renaming = false;
    }

    function handleRenameKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') submitRename();
        if (e.key === 'Escape') renaming = false;
    }

    async function submitColor() {
        editingColor = false;
        menuOpen = false;
        if (colorValue === column.color) return;
        try {
            const res = await fetch(`/api/columns/${column.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ color: colorValue })
            });
            if (!res.ok) {
                addToast('Failed to update column color');
            } else {
                onrefresh?.();
            }
        } catch {
            addToast('Failed to update column color');
        }
    }

    async function submitWipLimit() {
        editingWip = false;
        menuOpen = false;
        const limit = wipValue === '' ? null : parseInt(wipValue, 10);
        if (isNaN(limit as number) && limit !== null) {
            addToast('Invalid WIP limit');
            return;
        }
        try {
            const res = await fetch(`/api/columns/${column.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wipLimit: limit })
            });
            if (!res.ok) {
                addToast('Failed to update WIP limit');
            } else {
                onrefresh?.();
            }
        } catch {
            addToast('Failed to update WIP limit');
        }
    }

    async function deleteColumn() {
        deletingColumn = true;
        try {
            const res = await fetch(`/api/columns/${column.id}`, { method: 'DELETE' });
            if (!res.ok) {
                addToast('Failed to delete column');
            } else {
                showConfirmDelete = false;
                onrefresh?.();
            }
        } catch {
            addToast('Failed to delete column');
        } finally {
            deletingColumn = false;
        }
    }

    function openCard(card: CardWithTags) {
        onopencard?.(card);
    }

    function handleMenuKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') menuOpen = false;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
{#if showConfirmDelete}
    <ConfirmDialog
        message="Delete column '{column.name}'? This will delete all {column.cards.length} card(s) inside it. This cannot be undone."
        loading={deletingColumn}
        onconfirm={deleteColumn}
        oncancel={() => (showConfirmDelete = false)}
    />
{/if}

<div class="flex flex-col flex-shrink-0 w-[280px] h-full overflow-hidden"
     style="background: var(--bg-surface); border: 1px solid rgba(252,238,10,0.06);">

    <!-- Column Header -->
    <div class="flex items-center gap-2 px-3 py-2 flex-shrink-0 relative"
         style="background: linear-gradient(90deg, {headerColor}10, transparent);
                border-bottom: 2px solid {headerColor}50;">

        <!-- Color accent bar -->
        <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background: {headerColor};"></div>

        {#if renaming}
            <input
                bind:this={renameInput}
                bind:value={renameValue}
                class="flex-1 bg-transparent border-b text-white text-xs font-rajdhani font-bold uppercase tracking-[0.12em] focus:outline-none ml-1"
                style="border-color: {headerColor};"
                onkeydown={handleRenameKeydown}
                onblur={submitRename}
            />
        {:else}
            <button
                class="flex-1 text-left bg-transparent border-none p-0 text-white text-xs font-rajdhani font-bold uppercase tracking-[0.12em] cursor-pointer transition-colors truncate ml-1"
                style="--hover-color: {headerColor};"
                onmouseenter={(e) => e.currentTarget.style.color = headerColor}
                onmouseleave={(e) => e.currentTarget.style.color = 'white'}
                onclick={startRename}
                title="Click to rename"
            >
                {column.name}
            </button>
        {/if}

        <!-- Card count / WIP badge -->
        <span
            class="text-[10px] font-mono px-1.5 py-0.5"
            style="border: 1px solid {wipExceeded ? 'var(--cyber-red-bright)' : 'rgba(252,238,10,0.12)'};
                   color: {wipExceeded ? 'var(--cyber-red-bright)' : 'var(--text-muted)'};
                   {wipExceeded ? 'background: rgba(255,0,60,0.1);' : ''}"
        >
            {column.cards.length}{column.wipLimit !== null ? `/${column.wipLimit}` : ''}
        </span>

        <!-- Kebab menu -->
        <div class="relative">
            <button
                class="w-6 h-6 flex items-center justify-center transition-colors"
                style="color: var(--text-muted);"
                onmouseenter={(e) => e.currentTarget.style.color = 'var(--cyber-yellow)'}
                onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                onclick={(e: MouseEvent) => { e.stopPropagation(); menuOpen = !menuOpen; }}
                onkeydown={handleMenuKeydown}
                title="Column options"
            >
                ⋮
            </button>

            {#if menuOpen}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                    class="absolute right-0 top-full mt-1 w-44 z-20 overflow-hidden clip-cyber-sm"
                    style="background: var(--bg-card); border: 1px solid rgba(252,238,10,0.2); box-shadow: 0 8px 24px rgba(0,0,0,0.7), 0 0 12px rgba(252,238,10,0.05);"
                    onclick={(e: MouseEvent) => e.stopPropagation()}
                    role="presentation"
                >
                    <button
                        class="w-full text-left px-3 py-2 text-xs font-rajdhani font-semibold uppercase tracking-wider text-[#D4D4D4] hover:bg-[rgba(252,238,10,0.06)] hover:text-cyber-yellow transition-colors"
                        onclick={startRename}
                    >
                        Rename
                    </button>

                    <button
                        class="w-full text-left px-3 py-2 text-xs font-rajdhani font-semibold uppercase tracking-wider text-[#D4D4D4] hover:bg-[rgba(252,238,10,0.06)] hover:text-cyber-yellow transition-colors flex items-center gap-2"
                        onclick={() => { editingColor = !editingColor; editingWip = false; }}
                    >
                        <span>Set Color</span>
                        <span class="w-3 h-3 ml-auto" style="background: {headerColor};"></span>
                    </button>

                    {#if editingColor}
                        <div class="px-3 py-2 flex items-center gap-2">
                            <input
                                type="color"
                                bind:value={colorValue}
                                class="w-8 h-6 cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <button
                                class="text-xs font-rajdhani font-semibold text-cyber-yellow hover:underline uppercase"
                                onclick={submitColor}
                            >Apply</button>
                        </div>
                    {/if}

                    <button
                        class="w-full text-left px-3 py-2 text-xs font-rajdhani font-semibold uppercase tracking-wider text-[#D4D4D4] hover:bg-[rgba(252,238,10,0.06)] hover:text-cyber-yellow transition-colors"
                        onclick={() => { editingWip = !editingWip; editingColor = false; }}
                    >
                        WIP Limit {column.wipLimit !== null ? `(${column.wipLimit})` : ''}
                    </button>

                    {#if editingWip}
                        <div class="px-3 py-2 flex items-center gap-2">
                            <input
                                type="number"
                                bind:value={wipValue}
                                min="1"
                                placeholder="No limit"
                                class="w-16 bg-cyber-dark border px-2 py-1 text-xs font-mono text-white focus:outline-none"
                                style="border-color: rgba(252,238,10,0.15);"
                                onfocus={(e) => e.currentTarget.style.borderColor = 'var(--cyber-yellow)'}
                                onblur={(e) => e.currentTarget.style.borderColor = 'rgba(252,238,10,0.15)'}
                            />
                            <button
                                class="text-xs font-rajdhani font-semibold text-cyber-yellow hover:underline uppercase"
                                onclick={submitWipLimit}
                            >Apply</button>
                        </div>
                    {/if}

                    <div class="mt-1" style="border-top: 1px solid rgba(197,0,60,0.25);"></div>
                    <button
                        class="w-full text-left px-3 py-2 text-xs font-rajdhani font-semibold uppercase tracking-wider transition-colors"
                        style="color: var(--cyber-red-bright);"
                        onmouseenter={(e) => e.currentTarget.style.background = 'rgba(197,0,60,0.08)'}
                        onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
                        onclick={() => { showConfirmDelete = true; menuOpen = false; }}
                    >
                        Delete Column
                    </button>
                </div>
            {/if}
        </div>
    </div>

    <!-- Cards area (DnD zone) -->
    <div
        class="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-2"
        use:dndzone={{
            items,
            type: 'card',
            dropTargetStyle: { outline: '1px dashed rgba(252,238,10,0.25)', outlineOffset: '-2px' }
        }}
        onconsider={handleDndConsider}
        onfinalize={handleDndFinalize}
    >
        {#each items as card (card.id)}
            <div class="card-wrapper">
                <Card {card} onopen={openCard} />
            </div>
        {/each}
        {#if items.length === 0}
            <EmptyState message="Drop cards here" />
        {/if}
    </div>

    <!-- Quick add footer -->
    <div class="flex-shrink-0" style="border-top: 1px solid rgba(252,238,10,0.05);">
        <CardQuickAdd columnId={column.id} />
    </div>
</div>

<!-- Close menu on outside click -->
{#if menuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-10" onclick={() => (menuOpen = false)} role="presentation"></div>
{/if}

<style>
    /* DnD drag ghost styling */
    :global([data-is-dnd-shadow-item]) .card-wrapper {
        opacity: 0.4;
        border: 1px dashed rgba(252, 238, 10, 0.4) !important;
        box-shadow: 0 0 10px rgba(252, 238, 10, 0.15) !important;
    }
</style>
