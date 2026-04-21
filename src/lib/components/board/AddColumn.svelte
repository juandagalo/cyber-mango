<script lang="ts">
    import { addToast } from '$lib/stores/toast.js';

    let { boardId, onrefresh }: {
        boardId: string;
        onrefresh?: () => void;
    } = $props();

    let adding = $state(false);
    let inputValue = $state('');
    let loading = $state(false);
    let inputEl = $state<HTMLInputElement | undefined>(undefined);

    function startAdding() {
        adding = true;
        inputValue = '';
        setTimeout(() => inputEl?.focus(), 50);
    }

    function cancel() {
        adding = false;
        inputValue = '';
    }

    async function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') await createColumn();
        if (e.key === 'Escape') cancel();
    }

    async function createColumn() {
        const name = inputValue.trim();
        if (!name || loading) return;

        loading = true;
        try {
            const res = await fetch('/api/columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardId, name })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                addToast(err.error ?? 'Failed to create column');
                return;
            }

            adding = false;
            inputValue = '';
            onrefresh?.();
        } catch {
            addToast('Failed to create column');
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex-shrink-0 w-[280px] self-start">
    {#if adding}
        <div class="p-3 flex flex-col gap-2 clip-cyber-sm"
             style="background: var(--bg-surface); border: 1px solid rgba(252,238,10,0.15);">
            <input
                bind:this={inputEl}
                bind:value={inputValue}
                type="text"
                placeholder="Column name..."
                disabled={loading}
                class="w-full bg-transparent px-3 py-1.5 text-xs font-rajdhani font-semibold text-white uppercase tracking-wider focus:outline-none transition-colors"
                style="border: 1px solid rgba(252,238,10,0.15);"
                onfocus={(e) => e.currentTarget.style.borderColor = 'var(--cyber-yellow)'}
                onblur={(e) => e.currentTarget.style.borderColor = 'rgba(252,238,10,0.15)'}
                onkeydown={handleKeydown}
            />
            <div class="flex gap-2">
                <button
                    class="flex-1 py-1.5 text-xs font-rajdhani font-bold uppercase tracking-wider clip-cyber-sm cyber-hover-fill-yellow"
                    style="border: 1px solid;"
                    onclick={createColumn}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Add'}
                </button>
                <button
                    class="flex-1 py-1.5 text-xs font-rajdhani font-semibold uppercase tracking-wider cyber-hover-cancel"
                    style="border: 1px solid;"
                    onclick={cancel}
                    disabled={loading}
                >
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <button
            class="w-full py-3 px-4 text-xs font-rajdhani font-semibold uppercase tracking-[0.1em] flex items-center gap-2 justify-center cyber-hover-add"
            style="border: 1px dashed;"
            onclick={startAdding}
        >
            <span class="text-base leading-none">+</span>
            Add Column
        </button>
    {/if}
</div>
