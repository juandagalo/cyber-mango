<script lang="ts">
    import { onMount } from 'svelte';
    import type { Tag } from '$lib/types/board.js';
    import TagBadge from './TagBadge.svelte';
    import { addToast } from '$lib/stores/toast.js';

    let { boardId, cardId, assignedTagIds = [], onchange }: {
        boardId: string;
        cardId: string;
        assignedTagIds?: string[];
        onchange?: () => void;
    } = $props();

    let tags = $state<Tag[]>([]);
    let loading = $state(true);
    let filter = $state('');
    let creatingNew = $state(false);
    let newTagName = $state('');
    let newTagColor = $state('#FCEE0A');
    let savingNew = $state(false);

    async function loadTags() {
        loading = true;
        try {
            const res = await fetch(`/api/tags?boardId=${boardId}`);
            if (res.ok) {
                const data = await res.json();
                tags = data.tags ?? [];
            }
        } catch {
            addToast('Failed to load tags');
        } finally {
            loading = false;
        }
    }

    const filteredTags = $derived(tags.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase())
    ));

    async function assignTag(tagId: string) {
        if (assignedTagIds.includes(tagId)) {
            try {
                const res = await fetch(`/api/cards/${cardId}/tags/${tagId}`, { method: 'DELETE' });
                if (res.ok) {
                    assignedTagIds = assignedTagIds.filter(id => id !== tagId);
                    onchange?.();
                } else {
                    addToast('Failed to remove tag');
                }
            } catch {
                addToast('Failed to remove tag');
            }
        } else {
            try {
                const res = await fetch(`/api/cards/${cardId}/tags/${tagId}`, { method: 'POST' });
                if (res.ok) {
                    assignedTagIds = [...assignedTagIds, tagId];
                    onchange?.();
                } else {
                    addToast('Failed to assign tag');
                }
            } catch {
                addToast('Failed to assign tag');
            }
        }
    }

    async function createTag() {
        const name = newTagName.trim();
        if (!name || savingNew) return;

        savingNew = true;
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardId, name, color: newTagColor })
            });
            if (res.ok) {
                const data = await res.json();
                tags = [...tags, data.tag];
                newTagName = '';
                creatingNew = false;
                await assignTag(data.tag.id);
            } else {
                addToast('Failed to create tag');
            }
        } catch {
            addToast('Failed to create tag');
        } finally {
            savingNew = false;
        }
    }

    onMount(() => {
        loadTags();
    });
</script>

<div class="flex flex-col min-w-[200px]">
    <!-- Search -->
    <div class="p-2 cyber-divider-bottom-soft">
        <input
            bind:value={filter}
            type="text"
            placeholder="Search tags..."
            class="w-full bg-cyber-dark px-2 py-1 text-xs font-rajdhani font-semibold text-white focus:outline-none border cyber-input"
        />
    </div>

    <!-- Tag list -->
    <div class="overflow-y-auto max-h-48">
        {#if loading}
            <div class="px-3 py-4 text-xs font-rajdhani text-center text-cyber-muted">Loading...</div>
        {:else if filteredTags.length === 0 && !creatingNew}
            <div class="px-3 py-4 text-xs font-rajdhani text-center text-cyber-muted">No tags found</div>
        {:else}
            {#each filteredTags as tag (tag.id)}
                {@const assigned = assignedTagIds.includes(tag.id)}
                <div
                    class="px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors"
                    class:cyber-hover-card-item={!assigned}
                    style="background: {assigned ? 'rgba(252,238,10,0.04)' : ''};"
                    onclick={() => assignTag(tag.id)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && assignTag(tag.id)}
                >
                    <span
                        class="w-3 h-3 flex-shrink-0 flex items-center justify-center text-[8px]"
                        style="background: {assigned ? tag.color : 'transparent'}; border: 1px solid {tag.color};"
                    >
                        {#if assigned}✓{/if}
                    </span>
                    <TagBadge {tag} />
                </div>
            {/each}
        {/if}
    </div>

    <!-- Create new -->
    <div class="cyber-divider-soft">
        {#if creatingNew}
            <div class="p-2 flex flex-col gap-2">
                <input
                    bind:value={newTagName}
                    type="text"
                    placeholder="Tag name..."
                    class="w-full bg-cyber-dark px-2 py-1 text-xs font-rajdhani font-semibold text-white focus:outline-none border cyber-input"
                    onkeydown={(e) => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') creatingNew = false; }}
                />
                <div class="flex items-center gap-2">
                    <input type="color" bind:value={newTagColor} class="w-8 h-6 cursor-pointer" />
                    <button
                        class="flex-1 py-1 text-xs font-rajdhani font-bold uppercase disabled:opacity-50 border cyber-hover-fill-yellow"
                        onclick={createTag}
                        disabled={savingNew}
                    >
                        {savingNew ? '...' : 'Create'}
                    </button>
                    <button
                        class="py-1 px-2 text-xs cyber-hover-muted"
                        onclick={() => (creatingNew = false)}
                    >
                        x
                    </button>
                </div>
            </div>
        {:else}
            <button
                class="w-full px-3 py-2 text-xs font-rajdhani font-semibold text-left flex items-center gap-2 cyber-hover-muted"
                onclick={() => (creatingNew = true)}
            >
                <span class="text-base leading-none">+</span>
                Create new tag
            </button>
        {/if}
    </div>
</div>
