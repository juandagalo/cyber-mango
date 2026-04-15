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

<div class="flex flex-col flex-shrink-0 w-[280px] h-full rounded-lg overflow-hidden"
     style="background: #12121a; border: 1px solid rgba(0,255,255,0.08);">

    <!-- Column Header -->
    <div class="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
         style="border-bottom: 1px solid {headerColor}30;">
        <div class="w-2 h-2 rounded-full flex-shrink-0" style="background: {headerColor}; box-shadow: 0 0 4px {headerColor};"></div>

        {#if renaming}
            <input
                bind:this={renameInput}
                bind:value={renameValue}
                class="flex-1 bg-transparent border-b border-neon-cyan text-white text-xs font-mono uppercase tracking-wider focus:outline-none"
                onkeydown={handleRenameKeydown}
                onblur={submitRename}
            />
        {:else}
            <button
                class="flex-1 text-left bg-transparent border-none p-0 text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer hover:text-neon-cyan transition-colors truncate"
                onclick={startRename}
                title="Click to rename"
            >
                {column.name}
            </button>
        {/if}

        <!-- Card count / WIP badge -->
        <span
            class="text-[10px] font-mono px-1.5 py-0.5 rounded"
            class:text-neon-red={wipExceeded}
            class:border-neon-red={wipExceeded}
            class:text-[#808090]={!wipExceeded}
            class:border-[rgba(0,255,255,0.1)]={!wipExceeded}
            style="border: 1px solid; {wipExceeded ? 'background: rgba(255,0,64,0.1);' : ''}"
        >
            {column.cards.length}{column.wipLimit !== null ? `/${column.wipLimit}` : ''}
        </span>

        <!-- Kebab menu -->
        <div class="relative">
            <button
                class="w-6 h-6 flex items-center justify-center text-[#808090] hover:text-neon-cyan transition-colors rounded"
                onclick={(e: MouseEvent) => { e.stopPropagation(); menuOpen = !menuOpen; }}
                onkeydown={handleMenuKeydown}
                title="Column options"
            >
                ⋮
            </button>

            {#if menuOpen}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                    class="absolute right-0 top-full mt-1 w-44 z-20 rounded overflow-hidden"
                    style="background: #1a1a2e; border: 1px solid rgba(0,255,255,0.2); box-shadow: 0 8px 24px rgba(0,0,0,0.6);"
                    onclick={(e: MouseEvent) => e.stopPropagation()}
                    role="presentation"
                >
                    <button
                        class="w-full text-left px-3 py-2 text-xs font-mono text-[#e0e0e0] hover:bg-[rgba(0,255,255,0.08)] hover:text-neon-cyan transition-colors"
                        onclick={startRename}
                    >
                        Rename
                    </button>

                    <button
                        class="w-full text-left px-3 py-2 text-xs font-mono text-[#e0e0e0] hover:bg-[rgba(0,255,255,0.08)] hover:text-neon-cyan transition-colors flex items-center gap-2"
                        onclick={() => { editingColor = !editingColor; editingWip = false; }}
                    >
                        <span>Set Color</span>
                        <span class="w-3 h-3 rounded-full ml-auto" style="background: {headerColor};"></span>
                    </button>

                    {#if editingColor}
                        <div class="px-3 py-2 flex items-center gap-2">
                            <input
                                type="color"
                                bind:value={colorValue}
                                class="w-8 h-6 cursor-pointer rounded border-0 p-0 bg-transparent"
                            />
                            <button
                                class="text-xs font-mono text-neon-cyan hover:underline"
                                onclick={submitColor}
                            >Apply</button>
                        </div>
                    {/if}

                    <button
                        class="w-full text-left px-3 py-2 text-xs font-mono text-[#e0e0e0] hover:bg-[rgba(0,255,255,0.08)] hover:text-neon-cyan transition-colors"
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
                                class="w-16 bg-[#0a0a0f] border border-[rgba(0,255,255,0.2)] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-neon-cyan"
                            />
                            <button
                                class="text-xs font-mono text-neon-cyan hover:underline"
                                onclick={submitWipLimit}
                            >Apply</button>
                        </div>
                    {/if}

                    <div class="border-t border-[rgba(255,0,64,0.2)] mt-1"></div>
                    <button
                        class="w-full text-left px-3 py-2 text-xs font-mono text-neon-red hover:bg-[rgba(255,0,64,0.08)] transition-colors"
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
            dropTargetStyle: { outline: '1px dashed rgba(0,255,255,0.3)', outlineOffset: '-2px' }
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
    <div class="flex-shrink-0 border-t border-[rgba(0,255,255,0.05)]">
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
        border: 1px dashed rgba(0, 255, 255, 0.4) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.2) !important;
    }
</style>
