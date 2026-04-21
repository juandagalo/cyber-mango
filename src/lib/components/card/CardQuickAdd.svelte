<script lang="ts">
    import type { CardWithTags } from '$lib/types/board.js';
    import { addCardToStore } from '$lib/stores/board.js';
    import { addToast } from '$lib/stores/toast.js';

    let { columnId, oncreated }: {
        columnId: string;
        oncreated?: (card: CardWithTags) => void;
    } = $props();

    let inputValue = $state('');
    let loading = $state(false);
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
            oncreated?.(card);
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
        class="w-full bg-transparent px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50"
        style="border: 1px solid rgba(252,238,10,0.06); color: var(--text-muted);"
        onfocus={(e) => { e.currentTarget.style.borderColor = 'rgba(252,238,10,0.25)'; e.currentTarget.style.color = '#D4D4D4'; }}
        onblur={(e) => { e.currentTarget.style.borderColor = 'rgba(252,238,10,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        onkeydown={handleKeydown}
    />
</div>
