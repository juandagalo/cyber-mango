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
        <div class="rounded-lg p-3 flex flex-col gap-2"
             style="background: #12121a; border: 1px solid rgba(0,255,255,0.2);">
            <input
                bind:this={inputEl}
                bind:value={inputValue}
                type="text"
                placeholder="Column name..."
                disabled={loading}
                class="w-full bg-transparent border border-[rgba(0,255,255,0.2)] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-[#404060] focus:outline-none focus:border-neon-cyan transition-colors"
                onkeydown={handleKeydown}
            />
            <div class="flex gap-2">
                <button
                    class="flex-1 py-1.5 text-xs font-mono uppercase tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-[#0a0a0f] rounded transition-all disabled:opacity-50"
                    onclick={createColumn}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Add'}
                </button>
                <button
                    class="flex-1 py-1.5 text-xs font-mono uppercase tracking-wider border border-[rgba(0,255,255,0.2)] text-[#808090] hover:text-neon-cyan hover:border-neon-cyan rounded transition-all"
                    onclick={cancel}
                    disabled={loading}
                >
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <button
            class="w-full py-3 px-4 rounded-lg text-xs font-mono uppercase tracking-wider text-[#808090] hover:text-neon-cyan transition-all flex items-center gap-2 justify-center"
            style="background: rgba(0,255,255,0.03); border: 1px dashed rgba(0,255,255,0.15);"
            onclick={startAdding}
        >
            <span class="text-base leading-none">+</span>
            Add Column
        </button>
    {/if}
</div>
