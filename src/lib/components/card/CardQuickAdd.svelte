<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { addCardToStore } from '$lib/stores/board.js';
    import { addToast } from '$lib/stores/toast.js';

    export let columnId: string;

    const dispatch = createEventDispatcher();

    let inputValue = '';
    let loading = false;
    let inputEl: HTMLInputElement;

    async function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && inputValue.trim()) {
            await createCard();
        }
        if (e.key === 'Escape') {
            inputValue = '';
        }
    }

    async function createCard() {
        const title = inputValue.trim();
        if (!title || loading) return;

        loading = true;
        try {
            const res = await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columnId, title })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                addToast(err.error ?? 'Failed to create card');
                return;
            }

            const { card } = await res.json();
            addCardToStore(columnId, card);
            inputValue = '';
            dispatch('created', card);
        } catch {
            addToast('Failed to create card');
        } finally {
            loading = false;
        }
    }
</script>

<div class="px-2 pb-2 pt-1">
    <input
        bind:this={inputEl}
        bind:value={inputValue}
        type="text"
        placeholder="+ Add card..."
        disabled={loading}
        class="w-full bg-transparent border border-[rgba(0,255,255,0.1)] rounded px-3 py-1.5 text-xs font-mono text-[#808090] placeholder:text-[#404060] focus:outline-none focus:border-[rgba(0,255,255,0.4)] focus:text-[#e0e0e0] transition-colors disabled:opacity-50"
        on:keydown={handleKeydown}
    />
</div>
