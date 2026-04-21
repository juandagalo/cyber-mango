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
                class="px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider cyber-hover-yellow"
                style="border: 1px solid;"
                onclick={cancel}
                disabled={loading}
            >
                Cancel
            </button>
            <button
                class="px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider clip-cyber-sm disabled:opacity-50 cyber-hover-fill-red"
                style="border: 1px solid;"
                onclick={confirm}
                disabled={loading}
            >
                {loading ? 'Deleting...' : confirmLabel}
            </button>
        </div>
    </div>
</Modal>
