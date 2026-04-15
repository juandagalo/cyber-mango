<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import type { BoardWithColumns, ColumnWithCards, CardWithTags } from '$lib/types/board.js';
    import Column from './Column.svelte';
    import AddColumn from './AddColumn.svelte';
    import CardDetail from '$lib/components/card/CardDetail.svelte';
    import TagManager from '$lib/components/tag/TagManager.svelte';
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

    function handleColumnConsider(e: CustomEvent<{ items: ColumnWithCards[] }>) {
        columns = e.detail.items;
    }

    async function handleColumnFinalize(e: CustomEvent<{ items: ColumnWithCards[]; info: { id: string } }>) {
        columns = e.detail.items;

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
</script>

<!-- Board wrapper -->
<div class="flex flex-col h-full overflow-hidden">

<!-- Board sub-header -->
<div class="flex items-center justify-between px-6 py-2 border-b border-[rgba(0,255,255,0.06)] flex-shrink-0">
    <div class="flex items-center gap-3">
        <span class="font-['Orbitron'] font-bold text-white text-sm uppercase tracking-widest">
            {board.name}
        </span>
        <span class="text-[10px] font-mono text-[#808090] border border-[rgba(0,255,255,0.1)] px-1.5 py-0.5 rounded">
            {totalCards} CARDS
        </span>
        <span class="text-[10px] font-mono text-[#808090] border border-[rgba(0,255,255,0.1)] px-1.5 py-0.5 rounded">
            {columns.length} COLS
        </span>
    </div>
    <button
        class="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border border-[rgba(0,255,255,0.2)] text-[#808090] hover:text-neon-cyan hover:border-neon-cyan rounded transition-all"
        onclick={() => (showTagManager = true)}
    >
        Manage Tags
    </button>
</div>

<!-- Board columns scroll area -->
<div class="flex-1 min-h-0 overflow-x-auto overflow-y-hidden" style="max-height: calc(100% - 1px);">
    <div class="flex gap-3 p-4 h-full items-start">

        <!-- DnD columns container -->
        <div
            class="flex gap-3 h-full"
            use:dndzone={{
                items: columns,
                type: 'column',
                dropTargetStyle: { outline: '1px dashed rgba(0,255,255,0.25)', outlineOffset: '-2px' }
            }}
            onconsider={handleColumnConsider}
            onfinalize={handleColumnFinalize}
        >
            {#each columns as col (col.id)}
                <div class="h-full flex-shrink-0">
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
