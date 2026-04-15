<script lang="ts">
    import Modal from './Modal.svelte';

    let { message = 'Are you sure?', confirmLabel = 'Delete', loading = false, oncancel, onconfirm }: {
        message?: string;
        confirmLabel?: string;
        loading?: boolean;
        oncancel?: () => void;
        onconfirm?: () => void;
    } = $props();

    function cancel() {
        oncancel?.();
    }

    function confirm() {
        onconfirm?.();
    }
</script>

<Modal maxWidth="max-w-sm" onclose={cancel}>
    <div class="px-6 py-6 flex flex-col gap-6">
        <div class="flex items-start gap-4">
            <span class="text-2xl flex-shrink-0 mt-0.5" style="color: var(--cyber-red-bright);">⚠</span>
            <p class="font-rajdhani text-sm leading-relaxed" style="color: var(--text-primary);">{message}</p>
        </div>

        <div class="flex gap-3 justify-end">
            <button
                class="px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all"
                style="border: 1px solid rgba(252,238,10,0.2); color: var(--text-muted);"
                onmouseenter={(e) => { e.currentTarget.style.color = 'var(--cyber-yellow)'; e.currentTarget.style.borderColor = 'var(--cyber-yellow)'; }}
                onmouseleave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(252,238,10,0.2)'; }}
                onclick={cancel}
                disabled={loading}
            >
                Cancel
            </button>
            <button
                class="px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all clip-cyber-sm disabled:opacity-50"
                style="border: 1px solid var(--cyber-red-bright); color: var(--cyber-red-bright);"
                onmouseenter={(e) => { e.currentTarget.style.background = 'var(--cyber-red-bright)'; e.currentTarget.style.color = '#0D0D12'; }}
                onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cyber-red-bright)'; }}
                onclick={confirm}
                disabled={loading}
            >
                {loading ? 'Deleting...' : confirmLabel}
            </button>
        </div>
    </div>
</Modal>
