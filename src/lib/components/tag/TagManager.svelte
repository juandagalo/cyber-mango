<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Tag } from '$lib/types/board.js';
    import Modal from '$lib/components/ui/Modal.svelte';
    import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
    import { addToast } from '$lib/stores/toast.js';

    export let boardId: string;

    const dispatch = createEventDispatcher();

    interface TagWithCount extends Tag {
        cardCount?: number;
    }

    let tags: TagWithCount[] = [];
    let loading = true;
    let tagToDelete: Tag | null = null;
    let deletingTag = false;

    // Editing state per tag
    let editingId: string | null = null;
    let editName = '';
    let editColor = '';

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

    function startEdit(tag: Tag) {
        editingId = tag.id;
        editName = tag.name;
        editColor = tag.color;
    }

    function cancelEdit() {
        editingId = null;
    }

    async function saveEdit(tagId: string) {
        const name = editName.trim();
        if (!name) return;

        try {
            const res = await fetch(`/api/tags/${tagId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: editColor })
            });
            if (res.ok) {
                tags = tags.map(t => t.id === tagId ? { ...t, name, color: editColor } : t);
                editingId = null;
            } else {
                addToast('Failed to update tag');
            }
        } catch {
            addToast('Failed to update tag');
        }
    }

    async function deleteTag() {
        if (!tagToDelete || deletingTag) return;
        deletingTag = true;
        try {
            const res = await fetch(`/api/tags/${tagToDelete.id}`, { method: 'DELETE' });
            if (res.ok) {
                tags = tags.filter(t => t.id !== tagToDelete!.id);
                tagToDelete = null;
            } else {
                addToast('Failed to delete tag');
            }
        } catch {
            addToast('Failed to delete tag');
        } finally {
            deletingTag = false;
        }
    }

    // New tag creation
    let creatingNew = false;
    let newName = '';
    let newColor = '#BF00FF';
    let savingNew = false;

    async function createTag() {
        const name = newName.trim();
        if (!name || savingNew) return;
        savingNew = true;
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardId, name, color: newColor })
            });
            if (res.ok) {
                const data = await res.json();
                tags = [...tags, data.tag];
                newName = '';
                creatingNew = false;
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

{#if tagToDelete}
    <ConfirmDialog
        message="Delete tag '{tagToDelete.name}'? It will be removed from all cards."
        loading={deletingTag}
        on:confirm={deleteTag}
        on:cancel={() => (tagToDelete = null)}
    />
{/if}

<Modal title="MANAGE TAGS" maxWidth="max-w-lg" on:close={() => dispatch('close')}>
    <div class="px-6 py-4 flex flex-col gap-4">

        {#if loading}
            <p class="text-[#808090] text-xs font-mono text-center py-8">Loading tags...</p>
        {:else if tags.length === 0}
            <p class="text-[#808090] text-xs font-mono text-center py-8">No tags yet. Create one below.</p>
        {:else}
            <div class="flex flex-col gap-1">
                {#each tags as tag (tag.id)}
                    <div
                        class="flex items-center gap-3 px-3 py-2 rounded"
                        style="background: #1a1a2e;"
                    >
                        {#if editingId === tag.id}
                            <input
                                type="color"
                                bind:value={editColor}
                                class="w-8 h-6 rounded cursor-pointer flex-shrink-0"
                            />
                            <input
                                bind:value={editName}
                                type="text"
                                class="flex-1 bg-transparent border-b border-neon-cyan text-white text-xs font-mono focus:outline-none"
                                on:keydown={(e) => {
                                    if (e.key === 'Enter') saveEdit(tag.id);
                                    if (e.key === 'Escape') cancelEdit();
                                }}
                            />
                            <button
                                class="text-xs font-mono text-neon-cyan hover:underline flex-shrink-0"
                                on:click={() => saveEdit(tag.id)}
                            >Save</button>
                            <button
                                class="text-xs font-mono text-[#808090] hover:text-neon-cyan flex-shrink-0"
                                on:click={cancelEdit}
                            >✕</button>
                        {:else}
                            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background: {tag.color}; box-shadow: 0 0 4px {tag.color};"></span>
                            <span class="flex-1 text-xs font-mono text-[#e0e0e0] truncate">{tag.name}</span>
                            <button
                                class="text-[10px] font-mono text-[#808090] hover:text-neon-cyan transition-colors flex-shrink-0 px-1"
                                on:click={() => startEdit(tag)}
                            >Edit</button>
                            <button
                                class="text-[10px] font-mono text-[#808090] hover:text-neon-red transition-colors flex-shrink-0 px-1"
                                on:click={() => (tagToDelete = tag)}
                            >✕</button>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Create new -->
        <div class="border-t border-[rgba(0,255,255,0.1)] pt-4">
            {#if creatingNew}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <input type="color" bind:value={newColor} class="w-8 h-8 rounded cursor-pointer" />
                        <input
                            bind:value={newName}
                            type="text"
                            placeholder="New tag name..."
                            class="flex-1 bg-[#0a0a0f] border border-[rgba(0,255,255,0.2)] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-[#404060] focus:outline-none focus:border-neon-cyan"
                            on:keydown={(e) => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') creatingNew = false; }}
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="flex-1 py-1.5 text-xs font-mono uppercase tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-[#0a0a0f] rounded transition-all disabled:opacity-50"
                            on:click={createTag}
                            disabled={savingNew}
                        >
                            {savingNew ? 'Creating...' : 'Create Tag'}
                        </button>
                        <button
                            class="px-3 py-1.5 text-xs font-mono text-[#808090] hover:text-neon-cyan border border-[rgba(0,255,255,0.1)] rounded transition-all"
                            on:click={() => (creatingNew = false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <button
                    class="w-full py-2 text-xs font-mono uppercase tracking-wider text-[#808090] hover:text-neon-cyan border border-dashed border-[rgba(0,255,255,0.15)] rounded transition-all flex items-center justify-center gap-2"
                    on:click={() => (creatingNew = true)}
                >
                    <span>+</span> Add New Tag
                </button>
            {/if}
        </div>
    </div>
</Modal>
