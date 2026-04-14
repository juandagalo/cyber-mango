<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Tag } from '$lib/types/board.js';
    import TagBadge from './TagBadge.svelte';
    import { addToast } from '$lib/stores/toast.js';

    export let boardId: string;
    export let cardId: string;
    export let assignedTagIds: string[] = [];

    const dispatch = createEventDispatcher();

    let tags: Tag[] = [];
    let loading = true;
    let filter = '';
    let creatingNew = false;
    let newTagName = '';
    let newTagColor = '#00FFFF';
    let savingNew = false;

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

    $: filteredTags = tags.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase())
    );

    async function assignTag(tagId: string) {
        if (assignedTagIds.includes(tagId)) {
            // Remove
            try {
                const res = await fetch(`/api/cards/${cardId}/tags/${tagId}`, { method: 'DELETE' });
                if (res.ok) {
                    assignedTagIds = assignedTagIds.filter(id => id !== tagId);
                    dispatch('change');
                } else {
                    addToast('Failed to remove tag');
                }
            } catch {
                addToast('Failed to remove tag');
            }
        } else {
            // Assign
            try {
                const res = await fetch(`/api/cards/${cardId}/tags/${tagId}`, { method: 'POST' });
                if (res.ok) {
                    assignedTagIds = [...assignedTagIds, tagId];
                    dispatch('change');
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
                // Auto-assign the newly created tag
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

    loadTags();
</script>

<div class="flex flex-col" style="min-width: 200px;">
    <!-- Search -->
    <div class="p-2 border-b border-[rgba(0,255,255,0.1)]">
        <input
            bind:value={filter}
            type="text"
            placeholder="Search tags..."
            class="w-full bg-[#0a0a0f] border border-[rgba(0,255,255,0.2)] rounded px-2 py-1 text-xs font-mono text-white placeholder:text-[#404060] focus:outline-none focus:border-neon-cyan"
        />
    </div>

    <!-- Tag list -->
    <div class="overflow-y-auto max-h-48">
        {#if loading}
            <div class="px-3 py-4 text-xs font-mono text-[#808090] text-center">Loading...</div>
        {:else if filteredTags.length === 0 && !creatingNew}
            <div class="px-3 py-4 text-xs font-mono text-[#808090] text-center">No tags found</div>
        {:else}
            {#each filteredTags as tag (tag.id)}
                {@const assigned = assignedTagIds.includes(tag.id)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                    class="px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors"
                    class:bg-[rgba(0,255,255,0.06)]={assigned}
                    style="hover:background: rgba(0,255,255,0.04);"
                    on:click={() => assignTag(tag.id)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && assignTag(tag.id)}
                >
                    <span
                        class="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center text-[8px]"
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
    <div class="border-t border-[rgba(0,255,255,0.1)]">
        {#if creatingNew}
            <div class="p-2 flex flex-col gap-2">
                <input
                    bind:value={newTagName}
                    type="text"
                    placeholder="Tag name..."
                    class="w-full bg-[#0a0a0f] border border-[rgba(0,255,255,0.2)] rounded px-2 py-1 text-xs font-mono text-white placeholder:text-[#404060] focus:outline-none focus:border-neon-cyan"
                    on:keydown={(e) => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') creatingNew = false; }}
                />
                <div class="flex items-center gap-2">
                    <input type="color" bind:value={newTagColor} class="w-8 h-6 rounded cursor-pointer" />
                    <button
                        class="flex-1 py-1 text-xs font-mono text-neon-cyan border border-neon-cyan rounded hover:bg-neon-cyan hover:text-[#0a0a0f] transition-all disabled:opacity-50"
                        on:click={createTag}
                        disabled={savingNew}
                    >
                        {savingNew ? '...' : 'Create'}
                    </button>
                    <button
                        class="py-1 px-2 text-xs font-mono text-[#808090] hover:text-neon-cyan"
                        on:click={() => (creatingNew = false)}
                    >
                        ✕
                    </button>
                </div>
            </div>
        {:else}
            <button
                class="w-full px-3 py-2 text-xs font-mono text-[#808090] hover:text-neon-cyan transition-colors text-left flex items-center gap-2"
                on:click={() => (creatingNew = true)}
            >
                <span class="text-base leading-none">+</span>
                Create new tag
            </button>
        {/if}
    </div>
</div>
