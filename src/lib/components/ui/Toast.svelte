<script lang="ts">
    import { toasts, removeToast } from '$lib/stores/toast.js';
    import { fly } from 'svelte/transition';

    const typeStyles = {
        error: { border: 'border-neon-red', text: 'text-neon-red', icon: '✗' },
        success: { border: 'border-neon-green', text: 'text-neon-green', icon: '✓' },
        info: { border: 'border-neon-cyan', text: 'text-neon-cyan', icon: 'ℹ' }
    };
</script>

<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {#each $toasts as toast (toast.id)}
        {@const style = typeStyles[toast.type]}
        <div
            class="pointer-events-auto min-w-[280px] max-w-sm bg-[#12121a] border {style.border} rounded px-4 py-3 flex items-start gap-3 shadow-lg"
            style="box-shadow: 0 0 12px rgba(0,255,255,0.15);"
            in:fly={{ x: 50, duration: 200 }}
            out:fly={{ x: 50, duration: 150 }}
        >
            <span class="{style.text} text-lg font-bold flex-shrink-0">{style.icon}</span>
            <p class="text-[#e0e0e0] text-sm font-mono flex-1">{toast.message}</p>
            <button
                class="text-[#808090] hover:text-white flex-shrink-0 ml-2"
                on:click={() => removeToast(toast.id)}
            >
                ×
            </button>
        </div>
    {/each}
</div>
