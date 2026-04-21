<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import type { BoardWithColumns, ColumnWithCards, CardWithTags } from '$lib/types/board.js';
    import Column from './Column.svelte';
    import AddColumn from './AddColumn.svelte';
    import CardDetail from '$lib/components/card/CardDetail.svelte';
    import TagManager from '$lib/components/tag/TagManager.svelte';
    import PhaseManager from '$lib/components/tag/PhaseManager.svelte';
    import CardSearch from './CardSearch.svelte';
    import { boardStore } from '$lib/stores/board.js';
    import { addToast } from '$lib/stores/toast.js';

    let { board }: {
        board: BoardWithColumns;
    } = $props();

    let columns = $state<ColumnWithCards[]>([]);
    $effect(() => {
        columns = [...board.columns].sort((a, b) => a.position - b.position);
    });

    let selectedCard = $state<CardWithTags | null>(null);
    let showTagManager = $state(false);
    let showPhaseManager = $state(false);

    // Scroll container ref for horizontal scrolling
    let scrollContainer = $state<HTMLElement | undefined>(undefined);

    // Whether any modal is open (passed to CardSearch to disable Ctrl+K)
    const modalOpen = $derived(selectedCard !== null || showTagManager || showPhaseManager);

    const totalCards = $derived(board.columns.reduce((sum, col) => sum + col.cards.length, 0));

    async function refreshBoard() {
        try {
            const res = await fetch(`/api/boards/${board.id}`);
            if (!res.ok) {
                addToast('Failed to refresh board');
                return;
            }
            const data = await res.json();
            boardStore.set(data.board);
        } catch {
            addToast('Failed to refresh board');
        }
    }

    let isDndActive = $state(false);

    function handleColumnConsider(e: CustomEvent<{ items: ColumnWithCards[] }>) {
        columns = e.detail.items;
        isDndActive = true;
    }

    async function handleColumnFinalize(e: CustomEvent<{ items: ColumnWithCards[]; info: { id: string } }>) {
        columns = e.detail.items;
        isDndActive = false;

        const movedId = e.detail.info.id;
        const newIdx = columns.findIndex(c => c.id === movedId);
        const prev = columns[newIdx - 1];
        const next = columns[newIdx + 1];

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

        try {
            const res = await fetch(`/api/columns/${movedId}/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: newPosition })
            });
            if (!res.ok) {
                addToast('Failed to reorder columns — refreshing');
                await refreshBoard();
            }
        } catch {
            addToast('Failed to reorder columns — refreshing');
            await refreshBoard();
        }
    }

    function openCard(card: CardWithTags) {
        selectedCard = card;
    }

    function closeCard() {
        selectedCard = null;
        refreshBoard();
    }

    async function scrollToAndOpenCard(card: CardWithTags) {
        const cardExists = columns.some(col => col.cards.some(c => c.id === card.id));
        if (!cardExists) return;

        if (!scrollContainer || isDndActive) {
            selectedCard = card;
            return;
        }

        const colEl = scrollContainer.querySelector<HTMLElement>(`[data-column-id="${card.columnId}"]`);
        if (colEl) {
            colEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

            await new Promise<void>((resolve) => {
                let settled = false;
                const timeout = setTimeout(() => {
                    if (!settled) { settled = true; resolve(); }
                }, 800);
                scrollContainer!.addEventListener('scrollend', function onScrollEnd() {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timeout);
                        scrollContainer!.removeEventListener('scrollend', onScrollEnd);
                        resolve();
                    }
                }, { once: true });
            });
        }

        const cardEl = scrollContainer.querySelector<HTMLElement>(`[data-card-id="${card.id}"]`);
        if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            await new Promise<void>((resolve) => setTimeout(resolve, 300));

            cardEl.classList.add('card-search-highlight');
            setTimeout(() => cardEl.classList.remove('card-search-highlight'), 1100);
        }

        selectedCard = card;
    }
</script>

<!-- Board wrapper -->
<div class="flex flex-col h-full overflow-hidden">

<!-- Board sub-header: 3-column layout (info | search | buttons) -->
<div class="grid px-5 py-2 flex-shrink-0 items-center gap-3"
     style="grid-template-columns: 1fr auto 1fr; background: rgba(252,238,10,0.02); border-bottom: 1px solid rgba(252,238,10,0.08);">

    <!-- Left: board info -->
    <div class="flex items-center gap-3 min-w-0">
        <span class="font-rajdhani font-bold text-cyber-yellow text-sm uppercase tracking-[0.15em] truncate">
            // {board.name}
        </span>
        <div class="h-3 w-px flex-shrink-0 bg-[rgba(252,238,10,0.15)]"></div>
        <span class="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 flex-shrink-0"
              style="border: 1px solid rgba(252,238,10,0.1);">
            [{totalCards}] CARDS
        </span>
        <span class="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 flex-shrink-0"
              style="border: 1px solid rgba(252,238,10,0.1);">
            [{columns.length}] COLS
        </span>
    </div>

    <!-- Center: search -->
    <div class="flex justify-center">
        <CardSearch
            {columns}
            {modalOpen}
            onfound={scrollToAndOpenCard}
        />
    </div>

    <!-- Right: action buttons -->
    <div class="flex items-center gap-2 justify-end">
        <button
            class="text-xs font-rajdhani font-semibold uppercase tracking-[0.1em] px-4 py-1.5 transition-all clip-cyber-sm"
            style="border: 1px solid rgba(252,238,10,0.2); color: var(--text-muted); background: transparent;"
            onmouseenter={(e) => { e.currentTarget.style.color = 'var(--cyber-cyan)'; e.currentTarget.style.borderColor = 'var(--cyber-cyan)'; e.currentTarget.style.background = 'rgba(0,255,255,0.05)'; }}
            onmouseleave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(252,238,10,0.2)'; e.currentTarget.style.background = 'transparent'; }}
            onclick={() => (showPhaseManager = true)}
        >
            Manage Phases
        </button>
        <button
            class="text-xs font-rajdhani font-semibold uppercase tracking-[0.1em] px-4 py-1.5 transition-all clip-cyber-sm"
            style="border: 1px solid rgba(252,238,10,0.2); color: var(--text-muted); background: transparent;"
            onmouseenter={(e) => { e.currentTarget.style.color = 'var(--cyber-yellow)'; e.currentTarget.style.borderColor = 'var(--cyber-yellow)'; e.currentTarget.style.background = 'rgba(252,238,10,0.05)'; }}
            onmouseleave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(252,238,10,0.2)'; e.currentTarget.style.background = 'transparent'; }}
            onclick={() => (showTagManager = true)}
        >
            Manage Tags
        </button>
    </div>
</div>

<!-- Board columns scroll area -->
<div bind:this={scrollContainer} class="flex-1 min-h-0 overflow-x-auto overflow-y-hidden" style="max-height: calc(100% - 1px);">
    <div class="flex gap-3 p-4 h-full items-start">

        <!-- DnD columns container -->
        <div
            class="flex gap-3 h-full"
            use:dndzone={{
                items: columns,
                type: 'column',
                dropTargetStyle: { outline: '1px dashed rgba(252,238,10,0.25)', outlineOffset: '-2px' }
            }}
            onconsider={handleColumnConsider}
            onfinalize={handleColumnFinalize}
        >
            {#each columns as col (col.id)}
                <div class="h-full flex-shrink-0" data-column-id={col.id}>
                    <Column
                        column={col}
                        onrefresh={refreshBoard}
                        onopencard={openCard}
                    />
                </div>
            {/each}
        </div>

        <!-- Add column at end -->
        <div class="flex-shrink-0 self-start">
            <AddColumn boardId={board.id} onrefresh={refreshBoard} />
        </div>
    </div>
</div>

</div> <!-- end board wrapper -->

<!-- Card detail modal -->
{#if selectedCard}
    <CardDetail
        card={selectedCard}
        boardId={board.id}
        phases={board.phases ?? []}
        onclose={closeCard}
        onupdated={(card) => { selectedCard = card; }}
        ondeleted={closeCard}
    />
{/if}

<!-- Tag manager -->
{#if showTagManager}
    <TagManager
        boardId={board.id}
        onclose={() => { showTagManager = false; refreshBoard(); }}
    />
{/if}

<!-- Phase manager -->
{#if showPhaseManager}
    <PhaseManager
        boardId={board.id}
        onclose={() => { showPhaseManager = false; refreshBoard(); }}
    />
{/if}
