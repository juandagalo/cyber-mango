<script lang="ts">
    import { tick, untrack } from 'svelte';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import type { CardWithTags, Priority, Phase, Tag, ColumnWithCards } from '$lib/types/board.js';
    import Modal from '$lib/components/ui/Modal.svelte';
    import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
    import PriorityBadge from './PriorityBadge.svelte';
    import PhaseTracker from './PhaseTracker.svelte';
    import TagBadge from '$lib/components/tag/TagBadge.svelte';
    import TagPicker from '$lib/components/tag/TagPicker.svelte';
    import { updateCardInStore, removeCardFromStore } from '$lib/stores/board.js';
    import { addToast } from '$lib/stores/toast.js';

    let { card, boardId, phases = [], onclose, onupdated, ondeleted }: {
        card: CardWithTags;
        boardId: string;
        phases?: Phase[];
        onclose?: () => void;
        onupdated?: (card: CardWithTags) => void;
        ondeleted?: () => void;
    } = $props();

    // Local editable state — intentionally captures initial prop values
    let title = $state(untrack(() => card.title));
    let description = $state(untrack(() => card.description ?? ''));
    let priority = $state<Priority>(untrack(() => card.priority));
    let tags = $state<Tag[]>(untrack(() => [...card.tags]));
    let assignedTagIds = $state<string[]>(untrack(() => card.tags.map(t => t.id)));

    let currentPhaseId = $state<string | null>(untrack(() => card.phase?.id ?? null));
    let savingPhase = $state(false);

    let savingTitle = $state(false);
    let savingDesc = $state(false);
    let savingPriority = $state(false);
    let deletingCard = $state(false);
    let showConfirmDelete = $state(false);
    let showTagPicker = $state(false);
    let editingDescription = $state(untrack(() => !card.description));

    // Debounce timers
    let titleTimer: ReturnType<typeof setTimeout>;
    let descTimer: ReturnType<typeof setTimeout>;

    // Markdown rendering
    marked.setOptions({ breaks: true, gfm: true });
    const renderedDescription = $derived(DOMPurify.sanitize(marked.parse(description || '') as string));

    const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
    const priorityColors: Record<Priority, string> = {
        critical: '#FF003C',
        high: '#ED1E79',
        medium: '#FCEE0A',
        low: '#6A6A7A'
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
                updateCardInStore(card.id, { title: newTitle });
                onupdated?.({ ...card, title: newTitle });
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
                onupdated?.({ ...card, description: newDesc || null });
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
                onupdated?.({ ...card, priority: newPriority });
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

    async function changePhase(phaseId: string | null) {
        const prevPhaseId = currentPhaseId;
        currentPhaseId = phaseId;
        savingPhase = true;
        try {
            const res = await fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phaseId })
            });
            if (res.ok) {
                const resolvedPhase = phaseId ? phases.find(p => p.id === phaseId) ?? null : null;
                updateCardInStore(card.id, { phase: resolvedPhase });
                onupdated?.({ ...card, phase: resolvedPhase });
            } else {
                addToast('Failed to update phase');
                currentPhaseId = prevPhaseId;
            }
        } catch {
            addToast('Failed to update phase');
            currentPhaseId = prevPhaseId;
        } finally {
            savingPhase = false;
        }
    }

    async function deleteCard() {
        deletingCard = true;
        try {
            const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
            if (res.ok) {
                removeCardFromStore(card.id);
                showConfirmDelete = false;
                ondeleted?.();
            } else {
                addToast('Failed to delete card');
            }
        } catch {
            addToast('Failed to delete card');
        } finally {
            deletingCard = false;
        }
    }

    async function onTagChange() {
        try {
            const res = await fetch(`/api/boards/${boardId}`);
            if (res.ok) {
                const data = await res.json();
                const allCards = (data.board.columns as ColumnWithCards[]).flatMap((c) => c.cards);
                const updatedCard = allCards.find((c) => c.id === card.id);
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
        onclose?.();
    }
</script>

<Modal onclose={close} maxWidth="max-w-5xl">
    <div class="px-6 py-5 flex flex-col gap-5 max-h-[80vh] overflow-hidden">

        <div class="grid grid-cols-1 md:grid-cols-[7fr,3fr] gap-6 flex-1 min-h-0">

            <!-- Left column: Title + Description -->
            <div class="flex flex-col gap-4 min-w-0 min-h-0">

                <!-- Title -->
                <div class="flex flex-col gap-1.5">
                    <label for="card-title" class="text-[10px] font-rajdhani font-semibold uppercase tracking-[0.12em]" style="color: var(--text-muted);">// Title</label>
                    <input
                        id="card-title"
                        bind:value={title}
                        type="text"
                        class="bg-transparent px-3 py-2 text-sm font-rajdhani font-semibold text-white focus:outline-none transition-colors"
                        style="border: 1px solid rgba(252,238,10,0.12);"
                        onfocus={(e) => e.currentTarget.style.borderColor = 'var(--cyber-yellow)'}
                        onblur={(e) => { e.currentTarget.style.borderColor = 'rgba(252,238,10,0.12)'; saveTitle(); }}
                        oninput={onTitleInput}
                    />
                </div>

                <!-- Description -->
                <div class="flex flex-col gap-1.5 flex-1 min-h-0">
                    <div class="flex items-center justify-between">
                        <label for="card-desc" class="text-[10px] font-rajdhani font-semibold uppercase tracking-[0.12em]" style="color: var(--text-muted);">// Description</label>
                        <button
                            class="text-[10px] font-rajdhani font-bold uppercase tracking-wider px-2 py-0.5 transition-colors"
                            class:cyber-hover-muted={!editingDescription}
                            style="color: {editingDescription ? 'var(--cyber-cyan)' : ''}; border: 1px solid {editingDescription ? 'rgba(2,215,242,0.3)' : 'transparent'}; background: {editingDescription ? 'rgba(2,215,242,0.05)' : 'transparent'};"
                            onclick={() => { editingDescription = !editingDescription; }}
                        >
                            {editingDescription ? 'Preview' : 'Edit'}
                        </button>
                    </div>

                    {#if editingDescription}
                        <textarea
                            id="card-desc"
                            bind:value={description}
                            rows="12"
                            placeholder="Add a description... (supports markdown)"
                            class="bg-transparent px-3 py-2 text-sm font-mono resize-none flex-1 min-h-0 focus:outline-none transition-colors"
                            style="border: 1px solid rgba(252,238,10,0.12); color: var(--text-primary);"
                            onfocus={(e) => e.currentTarget.style.borderColor = 'var(--cyber-yellow)'}
                            onblur={(e) => { e.currentTarget.style.borderColor = 'rgba(252,238,10,0.12)'; saveDescription(); }}
                            oninput={onDescInput}
                        ></textarea>
                    {:else}
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                        <div
                            class="markdown-body px-4 py-3 text-sm flex-1 min-h-0 overflow-y-auto cursor-text"
                            style="border: 1px solid rgba(252,238,10,0.08); color: var(--text-primary);"
                            ondblclick={() => { editingDescription = true; }}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => { if (e.key === 'Enter') editingDescription = true; }}
                        >
                            {#if description}
                                {@html renderedDescription}
                            {:else}
                                <p class="italic" style="color: var(--text-muted);">Double-click to add a description...</p>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Right column: Priority, Tags, Timestamps, Delete -->
            <div class="flex flex-col gap-5 md:pl-6 overflow-y-auto min-h-0" style="border-left: 1px solid rgba(252,238,10,0.06);">

                <!-- Priority -->
                <div class="flex flex-col gap-2">
                    <span class="text-[10px] font-rajdhani font-semibold uppercase tracking-[0.12em]" style="color: var(--text-muted);">// Priority</span>
                    <div class="flex gap-2 flex-wrap">
                        {#each priorities as p}
                            <button
                                class="px-3 py-1.5 text-[10px] font-rajdhani font-bold uppercase tracking-wider transition-all"
                                style="
                                    color: {priorityColors[p]};
                                    border: 1px solid {priorityColors[p]};
                                    background: {priority === p ? priorityColors[p] + '20' : 'transparent'};
                                    {priority === p ? `box-shadow: 0 0 8px ${priorityColors[p]}30;` : ''}
                                "
                                onmouseenter={(e) => { if (priority !== p) { e.currentTarget.style.background = priorityColors[p] + '30'; e.currentTarget.style.boxShadow = `0 0 16px ${priorityColors[p]}50, inset 0 0 8px ${priorityColors[p]}15`; } }}
                                onmouseleave={(e) => { if (priority !== p) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; } }}
                                onclick={() => changePriority(p)}
                                disabled={savingPriority}
                            >
                                {p}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Phase -->
                <PhaseTracker {phases} {currentPhaseId} onchange={changePhase} />

                <!-- Tags -->
                <div class="flex flex-col gap-2">
                    <span class="text-[10px] font-rajdhani font-semibold uppercase tracking-[0.12em]" style="color: var(--text-muted);">// Tags</span>
                    <div class="flex flex-wrap gap-1.5 items-center">
                        {#each tags as tag (tag.id)}
                            <TagBadge {tag} />
                        {/each}
                        <div class="relative">
                            <button
                                class="px-2 py-0.5 text-[10px] font-rajdhani font-semibold uppercase cyber-hover-cancel"
                                style="border: 1px solid;"
                                onclick={(e: MouseEvent) => { e.stopPropagation(); showTagPicker = !showTagPicker; }}
                            >
                                + Tag
                            </button>

                            {#if showTagPicker}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <div
                                    class="absolute right-0 top-full mt-1 z-30 overflow-hidden clip-cyber-sm"
                                    style="background: var(--bg-surface); border: 1px solid rgba(252,238,10,0.2); box-shadow: 0 8px 24px rgba(0,0,0,0.7); min-width: 220px;"
                                    onclick={(e: MouseEvent) => e.stopPropagation()}
                                    role="presentation"
                                >
                                    <TagPicker
                                        {boardId}
                                        cardId={card.id}
                                        {assignedTagIds}
                                        onchange={onTagChange}
                                    />
                                </div>

                                <!-- Close picker on outside click -->
                                <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                                <div
                                    class="fixed inset-0 z-20"
                                    role="presentation"
                                    onclick={() => (showTagPicker = false)}
                                ></div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Timestamps -->
                <div class="flex flex-col gap-2 text-[10px] font-mono pt-3" style="border-top: 1px solid rgba(252,238,10,0.06); color: var(--text-muted);">
                    <div>
                        <span class="uppercase tracking-wider">Created</span>
                        <span class="ml-2" style="color: var(--cyber-cyan);">{formatDate(card.createdAt)}</span>
                    </div>
                    <div>
                        <span class="uppercase tracking-wider">Updated</span>
                        <span class="ml-2" style="color: var(--cyber-cyan);">{formatDate(card.updatedAt)}</span>
                    </div>
                </div>

                <!-- Delete -->
                <div class="pt-3 mt-auto" style="border-top: 1px solid rgba(197,0,60,0.15);">
                    <button
                        class="w-full px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider clip-cyber-sm cyber-hover-fill-red"
                        style="border: 1px solid;"
                        onclick={() => (showConfirmDelete = true)}
                    >
                        Delete Card
                    </button>
                </div>
            </div>
        </div>
    </div>
</Modal>

{#if showConfirmDelete}
    <ConfirmDialog
        message="Delete card '{card.title}'? This cannot be undone."
        loading={deletingCard}
        onconfirm={deleteCard}
        oncancel={() => (showConfirmDelete = false)}
    />
{/if}
