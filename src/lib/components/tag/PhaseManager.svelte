<script lang="ts">
    import { onMount } from 'svelte';
    import type { Phase } from '$lib/types/board.js';
    import Modal from '$lib/components/ui/Modal.svelte';
    import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
    import { addToast } from '$lib/stores/toast.js';
    import { addPhaseToStore, updatePhaseInStore, removePhaseFromStore, setPhasesInStore } from '$lib/stores/board.js';

    let { boardId, onclose }: {
        boardId: string;
        onclose?: () => void;
    } = $props();

    let phases = $state<Phase[]>([]);
    let loading = $state(true);
    let phaseToDelete = $state<Phase | null>(null);
    let deletingPhase = $state(false);

    let editingId = $state<string | null>(null);
    let editName = $state('');
    let editColor = $state('');

    let creatingNew = $state(false);
    let newName = $state('');
    let newColor = $state('#00FFFF');
    let savingNew = $state(false);

    async function loadPhases() {
        loading = true;
        try {
            const res = await fetch(`/api/boards/${boardId}/phases`);
            if (res.ok) {
                const data = await res.json();
                phases = data.phases ?? [];
            }
        } catch {
            addToast('Failed to load phases');
        } finally {
            loading = false;
        }
    }

    function startEdit(phase: Phase) {
        editingId = phase.id;
        editName = phase.name;
        editColor = phase.color;
    }

    function cancelEdit() {
        editingId = null;
    }

    async function saveEdit(phaseId: string) {
        const name = editName.trim();
        if (!name) return;

        try {
            const res = await fetch(`/api/phases/${phaseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: editColor })
            });
            if (res.ok) {
                phases = phases.map(p => p.id === phaseId ? { ...p, name, color: editColor } : p);
                updatePhaseInStore(phaseId, { name, color: editColor });
                editingId = null;
            } else {
                addToast('Failed to update phase');
            }
        } catch {
            addToast('Failed to update phase');
        }
    }

    async function deletePhase() {
        if (!phaseToDelete || deletingPhase) return;
        deletingPhase = true;
        try {
            const res = await fetch(`/api/phases/${phaseToDelete.id}`, { method: 'DELETE' });
            if (res.ok) {
                removePhaseFromStore(phaseToDelete.id);
                phases = phases.filter(p => p.id !== phaseToDelete!.id);
                phaseToDelete = null;
            } else {
                addToast('Failed to delete phase');
            }
        } catch {
            addToast('Failed to delete phase');
        } finally {
            deletingPhase = false;
        }
    }

    async function createPhase() {
        const name = newName.trim();
        if (!name || savingNew) return;
        savingNew = true;
        try {
            const res = await fetch(`/api/boards/${boardId}/phases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: newColor })
            });
            if (res.ok) {
                const data = await res.json();
                phases = [...phases, data.phase];
                addPhaseToStore(data.phase);
                newName = '';
                creatingNew = false;
            } else {
                addToast('Failed to create phase');
            }
        } catch {
            addToast('Failed to create phase');
        } finally {
            savingNew = false;
        }
    }

    async function movePhase(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= phases.length) return;

        const reordered = [...phases];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        const orderedIds = reordered.map(p => p.id);

        phases = reordered;

        try {
            const res = await fetch(`/api/boards/${boardId}/phases/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });
            if (res.ok) {
                const data = await res.json();
                phases = data.phases;
                setPhasesInStore(data.phases);
            } else {
                addToast('Failed to reorder phases');
                await loadPhases();
            }
        } catch {
            addToast('Failed to reorder phases');
            await loadPhases();
        }
    }

    onMount(() => {
        loadPhases();
    });
</script>

{#if phaseToDelete}
    <ConfirmDialog
        message="Delete phase '{phaseToDelete.name}'? Cards assigned to it will be unassigned."
        loading={deletingPhase}
        onconfirm={deletePhase}
        oncancel={() => (phaseToDelete = null)}
    />
{/if}

<Modal title="MANAGE PHASES" maxWidth="max-w-lg" onclose={() => onclose?.()}>
    <div class="px-6 py-4 flex flex-col gap-4">

        {#if loading}
            <p class="text-xs font-rajdhani text-center py-8 text-cyber-muted">Loading phases...</p>
        {:else if phases.length === 0}
            <p class="text-xs font-rajdhani text-center py-8 text-cyber-muted">No phases yet. Create one below.</p>
        {:else}
            <div class="flex flex-col gap-1">
                {#each phases as phase, i (phase.id)}
                    <div class="flex items-center gap-3 px-3 py-2 bg-cyber-card-token">
                        {#if editingId === phase.id}
                            <input
                                type="color"
                                bind:value={editColor}
                                class="w-8 h-6 cursor-pointer flex-shrink-0"
                            />
                            <input
                                bind:value={editName}
                                type="text"
                                class="flex-1 bg-transparent text-white text-xs font-rajdhani font-semibold focus:outline-none cyber-input-underline"
                                onkeydown={(e) => {
                                    if (e.key === 'Enter') saveEdit(phase.id);
                                    if (e.key === 'Escape') cancelEdit();
                                }}
                            />
                            <button
                                class="text-xs font-rajdhani font-bold flex-shrink-0 uppercase text-cyber-yellow"
                                onclick={() => saveEdit(phase.id)}
                            >Save</button>
                            <button
                                class="text-xs flex-shrink-0 cyber-hover-muted"
                                onclick={cancelEdit}
                            >x</button>
                        {:else}
                            <span class="w-3 h-3 flex-shrink-0" style="background: {phase.color}; box-shadow: 0 0 4px {phase.color};"></span>
                            <span class="flex-1 text-xs font-rajdhani font-semibold truncate text-cyber-primary">{phase.name}</span>

                            <!-- Reorder buttons -->
                            {#if i > 0}
                                <button
                                    class="text-[10px] flex-shrink-0 px-0.5 cyber-hover-muted-cyan"
                                    title="Move up"
                                    onclick={() => movePhase(i, -1)}
                                >&#9650;</button>
                            {/if}
                            {#if i < phases.length - 1}
                                <button
                                    class="text-[10px] flex-shrink-0 px-0.5 cyber-hover-muted-cyan"
                                    title="Move down"
                                    onclick={() => movePhase(i, 1)}
                                >&#9660;</button>
                            {/if}

                            <button
                                class="text-[10px] font-rajdhani font-bold uppercase flex-shrink-0 px-1 cyber-hover-muted"
                                onclick={() => startEdit(phase)}
                            >Edit</button>
                            <button
                                class="text-[10px] flex-shrink-0 px-1 cyber-hover-muted-red"
                                onclick={() => (phaseToDelete = phase)}
                            >x</button>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Create new -->
        <div class="pt-4 cyber-divider-soft">
            {#if creatingNew}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <input type="color" bind:value={newColor} class="w-8 h-8 cursor-pointer" />
                        <input
                            bind:value={newName}
                            type="text"
                            placeholder="New phase name..."
                            class="flex-1 bg-cyber-dark px-3 py-1.5 text-xs font-rajdhani font-semibold text-white focus:outline-none border cyber-input"
                            onkeydown={(e) => { if (e.key === 'Enter') createPhase(); if (e.key === 'Escape') creatingNew = false; }}
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            class="flex-1 py-1.5 text-xs font-rajdhani font-bold uppercase tracking-wider clip-cyber-sm disabled:opacity-50 border cyber-hover-fill-yellow"
                            onclick={createPhase}
                            disabled={savingNew}
                        >
                            {savingNew ? 'Creating...' : 'Create Phase'}
                        </button>
                        <button
                            class="px-3 py-1.5 text-xs font-rajdhani font-semibold uppercase border cyber-hover-yellow"
                            onclick={() => (creatingNew = false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <button
                    class="w-full py-2 text-xs font-rajdhani font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border border-dashed cyber-hover-add"
                    onclick={() => (creatingNew = true)}
                >
                    <span>+</span> Add New Phase
                </button>
            {/if}
        </div>
    </div>
</Modal>
