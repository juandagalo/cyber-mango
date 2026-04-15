<script lang="ts">
    import { toasts, removeToast } from '$lib/stores/toast.js';
    import { fly } from 'svelte/transition';

    const typeStyles = {
        error: { border: 'var(--cyber-red-bright)', icon: '✗' },
        success: { border: '#39FF14', icon: '✓' },
        info: { border: 'var(--cyber-yellow)', icon: '!' }
    };
</script>

<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {#each $toasts as toast (toast.id)}
        {@const style = typeStyles[toast.type]}
        <div
            class="pointer-events-auto min-w-[280px] max-w-sm flex items-start gap-3 px-4 py-3 clip-cyber-sm"
            style="background: var(--bg-surface); border: 1px solid {style.border}; box-shadow: 0 0 15px rgba(0,0,0,0.5), 0 0 8px {style.border}20;"
            in:fly={{ x: 50, duration: 200 }}
            out:fly={{ x: 50, duration: 150 }}
        >
            <span class="text-lg font-bold flex-shrink-0" style="color: {style.border};">{style.icon}</span>
            <p class="text-sm font-rajdhani flex-1" style="color: var(--text-primary);">{toast.message}</p>
            <button
                class="flex-shrink-0 ml-2 transition-colors"
                style="color: var(--text-muted);"
                onmouseenter={(e) => e.currentTarget.style.color = 'white'}
                onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                onclick={() => removeToast(toast.id)}
            >
                ×
            </button>
        </div>
    {/each}
</div>
