<script lang="ts">
    import type { Tag } from '$lib/types/board.js';
    import Modal from '$lib/components/ui/Modal.svelte';
    import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
    import { addToast } from '$lib/stores/toast.js';

    let { boardId, onclose }: {
        boardId: string;
        onclose?: () => void;
    } = $props();

    interface TagWithCount extends Tag {
        cardCount?: number;
    }

    let tags = $state<TagWithCount[]>([]);
    let loading = $state(true);
    let tagToDelete = $state<Tag | null>(null);
    let deletingTag = $state(false);

    let editingId = $state<string | null>(null);
    let editName = $state('');
    let editColor = $state('');

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

    let creatingNew = $state(false);
    let newName = $state('');
    let newColor = $state('#FCEE0A');
    let savingNew = $state(false);

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
        onconfirm={deleteTag}
        oncancel={() => (tagToDelete = null)}
    />
{/if}

<Modal title="MANAGE TAGS" maxWidth="max-w-lg" onclose={() => onclose?.()}>
    <div class="px-6 py-4 flex flex-col gap-4">

        {#if loading}
            <p class="text-xs font-rajdhani text-center py-8" style="color: var(--text-muted);">Loading tags...</p>
        {:else if tags.length === 0}
            <p class="text-xs font-rajdhani text-center py-8" style="color: var(--text-muted);">No tags yet. Create one below.</p>
        {:else}
            <div class="flex flex-col gap-1">
                {#each tags as tag (tag.id)}
                    <div
                        class="flex items-center gap-3 px-3 py-2"
                        style="background: var(--bg-card);"
                    >
                        {#if editingId === tag.id}
                            <input
                                type="color"
                                bind:value={editColor}
                                class="w-8 h-6 cursor-pointer flex-shrink-0"
                            />
                            <input
                                bind:value={editName}
                                type="text"
                                class="flex-1 bg-transparent text-white text-xs font-rajdhani font-semibold focus:outline-none"
                                style="border-bottom: 1px solid var(--cyber-yellow);"
                                onkeydown={(e) => {
                                    if (e.key === 'Enter') saveEdit(tag.id);
                                    if (e.key === 'Escape') cancelEdit();
                                }}
                            />
                            <button
                                class="text-xs font-rajdhani font-bold flex-shrink-0 uppercase"
                                style="color: var(--cyber-yellow);"
                                onclick={() => saveEdit(tag.id)}
                            >Save</button>
                            <button
                                class="text-xs flex-shrink-0 cyber-hover-muted"
                                onclick={cancelEdit}
                            >x</button>
                        {:else}
                            <span class="w-3 h-3 flex-shrink-0" style="background: {tag.color}; box-shadow: 0 0 4px {tag.color};"></span>
                            <span class="flex-1 text-xs font-rajdhani font-semibold truncate" style="color: var(--text-primary);">{tag.name}</span>
                            <button
                                class="text-[10px] font-rajdhani font-bold uppercase flex-shrink-0 px-1 cyber-hover-muted"
                                onclick={() => startEdit(tag)}
                            >Edit</button>
                            <button
                                class="text-[10px] flex-shrink-0 px-1 cyber-hover-muted-red"
                                onclick={() => (tagToDelete = tag)}
                            >x</button>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Create new -->
        <div class="pt-4" style="border-top: 1px solid rgba(252,238,10,0.08);">
            {#if creatingNew}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <input type="color" bind:value={newColor} class="w-8 h-8 cursor-pointer" />
                        <input
                            bind:value={newName}
                            type="text"
                            placeholder="New tag name..."
                            class="flex-1 bg-cyber-dark px-3 py-1.5 text-xs font-rajdhani font-semibold text-white focus:outline-none transition-colors"
                            style="border: 1px solid rgba(252,238,10,0.15);"
                            onfocus={(e) => e.currentTarget.style.borderColor = 'var(--cyber-yellow)'}
                            onblur={(e) => e.currentTarget.style.borderColor = 'rgba(252,238,10,0.15)'}
                            onkeydown={(e) => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') creatingNew = false; }}
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="flex-1 py-1.5 text-xs font-rajdhani font-bold uppercase tracking-wider clip-cyber-sm disabled:opacity-50 cyber-hover-fill-yellow"
                            style="border: 1px solid;"
                            onclick={createTag}
                            disabled={savingNew}
                        >
                            {savingNew ? 'Creating...' : 'Create Tag'}
                        </button>
                        <button
                            class="px-3 py-1.5 text-xs font-rajdhani font-semibold uppercase cyber-hover-yellow"
                            style="border: 1px solid;"
                            onclick={() => (creatingNew = false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <button
                    class="w-full py-2 text-xs font-rajdhani font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cyber-hover-add"
                    style="border: 1px dashed;"
                    onclick={() => (creatingNew = true)}
                >
                    <span>+</span> Add New Tag
                </button>
            {/if}
        </div>
    </div>
</Modal>
