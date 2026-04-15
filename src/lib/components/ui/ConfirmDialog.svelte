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
            <span class="text-neon-red text-2xl flex-shrink-0 mt-0.5">⚠</span>
            <p class="text-[#e0e0e0] font-mono text-sm leading-relaxed">{message}</p>
        </div>

        <div class="flex gap-3 justify-end">
            <button
                class="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-[rgba(0,255,255,0.3)] text-[#808090] hover:text-neon-cyan hover:border-neon-cyan rounded transition-all"
                onclick={cancel}
                disabled={loading}
            >
                Cancel
            </button>
            <button
                class="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-neon-red text-neon-red hover:bg-neon-red hover:text-[#0a0a0f] rounded transition-all disabled:opacity-50"
                onclick={confirm}
                disabled={loading}
            >
                {loading ? 'Deleting...' : confirmLabel}
            </button>
        </div>
    </div>
</Modal>
