<script lang="ts">
    import { createEventDispatcher, tick } from 'svelte';
    import type { CardWithTags, Priority, Tag } from '$lib/types/board.js';
    import Modal from '$lib/components/ui/Modal.svelte';
    import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
    import PriorityBadge from './PriorityBadge.svelte';
    import TagBadge from '$lib/components/tag/TagBadge.svelte';
    import TagPicker from '$lib/components/tag/TagPicker.svelte';
    import { updateCardInStore, removeCardFromStore } from '$lib/stores/board.js';
    import { addToast } from '$lib/stores/toast.js';

    export let card: CardWithTags;
    export let boardId: string;

    const dispatch = createEventDispatcher();

    let title = card.title;
    let description = card.description ?? '';
    let priority: Priority = card.priority;
    let tags: Tag[] = [...card.tags];
    let assignedTagIds: string[] = card.tags.map(t => t.id);

    let savingTitle = false;
    let savingDesc = false;
    let savingPriority = false;
    let deletingCard = false;
    let showConfirmDelete = false;
    let showTagPicker = false;

    // Debounce timers
    let titleTimer: ReturnType<typeof setTimeout>;
    let descTimer: ReturnType<typeof setTimeout>;

    const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
    const priorityColors: Record<Priority, string> = {
        critical: '#FF0040',
        high: '#FF00FF',
        medium: '#00FFFF',
        low: '#404060'
    };

    function formatDate(dateStr: string): string {
        try {
            return new Date(dateStr).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }

    // Auto-save title on blur (debounced)
    function onTitleInput() {
        clearTimeout(titleTimer);
        titleTimer = setTimeout(saveTitle, 500);
    }

    async function saveTitle() {
        const newTitle = title.trim();
        if (!newTitle || newTitle === card.title) return;
        savingTitle = true;
        try {
            const res = await fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                const data = await res.json();
                updateCardInStore(card.id, { title: newTitle });
                dispatch('updated', { ...card, title: newTitle });
            } else {
                addToast('Failed to save title');
                title = card.title;
            }
        } catch {
            addToast('Failed to save title');
            title = card.title;
        } finally {
            savingTitle = false;
        }
    }

    function onDescInput() {
        clearTimeout(descTimer);
        descTimer = setTimeout(saveDescription, 500);
    }

    async function saveDescription() {
        const newDesc = description.trim();
        savingDesc = true;
        try {
            const res = await fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: newDesc || null })
            });
            if (res.ok) {
                updateCardInStore(card.id, { description: newDesc || null });
                dispatch('updated', { ...card, description: newDesc || null });
            } else {
                addToast('Failed to save description');
            }
        } catch {
            addToast('Failed to save description');
        } finally {
            savingDesc = false;
        }
    }

    async function changePriority(newPriority: Priority) {
        if (newPriority === priority) return;
        priority = newPriority;
        savingPriority = true;
        try {
            const res = await fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority })
            });
            if (res.ok) {
                updateCardInStore(card.id, { priority: newPriority });
                dispatch('updated', { ...card, priority: newPriority });
            } else {
                addToast('Failed to update priority');
                priority = card.priority;
            }
        } catch {
            addToast('Failed to update priority');
            priority = card.priority;
        } finally {
            savingPriority = false;
        }
    }

    async function deleteCard() {
        deletingCard = true;
        try {
            const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
            if (res.ok) {
                removeCardFromStore(card.id);
                showConfirmDelete = false;
                dispatch('deleted');
            } else {
                addToast('Failed to delete card');
            }
        } catch {
            addToast('Failed to delete card');
        } finally {
            deletingCard = false;
        }
    }

    // Refresh tags from card after TagPicker changes
    async function onTagChange() {
        // Re-fetch card tags
        try {
            const res = await fetch(`/api/boards/${boardId}`);
            if (res.ok) {
                const data = await res.json();
                const allCards = data.board.columns.flatMap((c: any) => c.cards);
                const updatedCard = allCards.find((c: any) => c.id === card.id);
                if (updatedCard) {
                    tags = updatedCard.tags;
                    assignedTagIds = updatedCard.tags.map((t: Tag) => t.id);
                    updateCardInStore(card.id, { tags: updatedCard.tags });
                }
            }
        } catch {
            // non-critical
        }
    }

    function close() {
        clearTimeout(titleTimer);
        clearTimeout(descTimer);
        dispatch('close');
    }
</script>

<Modal on:close={close}>
    <div class="px-6 py-5 flex flex-col gap-5">

        <!-- Title -->
        <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-mono uppercase tracking-wider text-[#808090]">Title</label>
            <input
                bind:value={title}
                type="text"
                class="bg-transparent border border-[rgba(0,255,255,0.15)] rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan transition-colors"
                on:input={onTitleInput}
                on:blur={saveTitle}
            />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-mono uppercase tracking-wider text-[#808090]">Description</label>
            <textarea
                bind:value={description}
                rows="4"
                placeholder="Add a description..."
                class="bg-transparent border border-[rgba(0,255,255,0.15)] rounded px-3 py-2 text-sm font-mono text-[#e0e0e0] placeholder:text-[#404060] focus:outline-none focus:border-neon-cyan transition-colors resize-none"
                on:input={onDescInput}
                on:blur={saveDescription}
            ></textarea>
        </div>

        <!-- Priority -->
        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-mono uppercase tracking-wider text-[#808090]">Priority</label>
            <div class="flex gap-2 flex-wrap">
                {#each priorities as p}
                    <button
                        class="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                        style="
                            color: {priorityColors[p]};
                            border: 1px solid {priorityColors[p]};
                            background: {priority === p ? priorityColors[p] + '25' : 'transparent'};
                            {priority === p ? `box-shadow: 0 0 8px ${priorityColors[p]}40;` : ''}
                        "
                        on:click={() => changePriority(p)}
                        disabled={savingPriority}
                    >
                        {p}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-mono uppercase tracking-wider text-[#808090]">Tags</label>
            <div class="flex flex-wrap gap-1.5 items-center">
                {#each tags as tag (tag.id)}
                    <TagBadge {tag} />
                {/each}
                <div class="relative">
                    <button
                        class="px-2 py-0.5 text-[10px] font-mono border border-[rgba(0,255,255,0.2)] text-[#808090] hover:text-neon-cyan hover:border-neon-cyan rounded transition-all"
                        on:click|stopPropagation={() => (showTagPicker = !showTagPicker)}
                    >
                        + Tag
                    </button>

                    {#if showTagPicker}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            class="absolute left-0 top-full mt-1 z-30 rounded overflow-hidden"
                            style="background: #12121a; border: 1px solid rgba(0,255,255,0.2); box-shadow: 0 8px 24px rgba(0,0,0,0.6); min-width: 220px;"
                            on:click|stopPropagation
                        >
                            <TagPicker
                                {boardId}
                                cardId={card.id}
                                {assignedTagIds}
                                on:change={onTagChange}
                            />
                        </div>

                        <!-- Close picker on outside click -->
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            class="fixed inset-0 z-20"
                            on:click={() => (showTagPicker = false)}
                        ></div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Timestamps -->
        <div class="flex gap-6 text-[10px] font-mono text-[#808090] border-t border-[rgba(0,255,255,0.08)] pt-3">
            <div>
                <span class="uppercase tracking-wider">Created</span><br />
                <span class="text-[#606070]">{formatDate(card.createdAt)}</span>
            </div>
            <div>
                <span class="uppercase tracking-wider">Updated</span><br />
                <span class="text-[#606070]">{formatDate(card.updatedAt)}</span>
            </div>
        </div>

        <!-- Delete -->
        <div class="border-t border-[rgba(255,0,64,0.15)] pt-3">
            <button
                class="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-neon-red text-neon-red hover:bg-neon-red hover:text-[#0a0a0f] rounded transition-all"
                on:click={() => (showConfirmDelete = true)}
            >
                Delete Card
            </button>
        </div>
    </div>
</Modal>

{#if showConfirmDelete}
    <ConfirmDialog
        message="Delete card '{card.title}'? This cannot be undone."
        loading={deletingCard}
        on:confirm={deleteCard}
        on:cancel={() => (showConfirmDelete = false)}
    />
{/if}
