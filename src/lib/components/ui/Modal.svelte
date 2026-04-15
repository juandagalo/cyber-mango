<script lang="ts">
    import type { Snippet } from 'svelte';
    import { onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    let { title = '', maxWidth = 'max-w-2xl', onclose, children }: {
        title?: string;
        maxWidth?: string;
        onclose?: () => void;
        children?: Snippet;
    } = $props();

    function close() {
        onclose?.();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') close();
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);"
    onclick={handleBackdropClick}
    role="presentation"
    transition:fade={{ duration: 150 }}
>
    <div
        class="relative w-full {maxWidth} overflow-hidden clip-cyber"
        style="background: var(--bg-surface);
               border: 1px solid rgba(252,238,10,0.2);
               box-shadow: 0 0 40px rgba(252,238,10,0.08), 0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(252,238,10,0.05);"
        transition:scale={{ start: 0.95, duration: 150 }}
    >
        <!-- Top accent line -->
        <div class="absolute top-0 left-0 right-0 h-px"
             style="background: linear-gradient(90deg, var(--cyber-red), var(--cyber-yellow) 50%, transparent);"></div>

        {#if title}
            <div class="flex items-center justify-between px-6 py-3"
                 style="border-bottom: 1px solid rgba(252,238,10,0.1); background: rgba(252,238,10,0.02);">
                <h2 class="font-rajdhani font-bold text-white uppercase tracking-[0.12em] text-sm">// {title}</h2>
                <button
                    class="text-xl leading-none transition-colors"
                    style="color: var(--text-muted);"
                    onmouseenter={(e) => e.currentTarget.style.color = 'var(--cyber-yellow)'}
                    onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    onclick={close}
                >
                    ×
                </button>
            </div>
        {:else}
            <button
                class="absolute top-4 right-4 text-xl leading-none z-10 transition-colors"
                style="color: var(--text-muted);"
                onmouseenter={(e) => e.currentTarget.style.color = 'var(--cyber-yellow)'}
                onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                onclick={close}
            >
                ×
            </button>
        {/if}

        <div class="overflow-y-auto max-h-[85vh]">
            {#if children}
                {@render children()}
            {/if}
        </div>

        <!-- Bottom accent line -->
        <div class="absolute bottom-0 left-0 right-0 h-px"
             style="background: linear-gradient(90deg, transparent, var(--cyber-yellow) 50%, var(--cyber-red));
                    opacity: 0.3;"></div>
    </div>
</div>
