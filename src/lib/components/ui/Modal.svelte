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
    style="background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);"
    onclick={handleBackdropClick}
    role="presentation"
    transition:fade={{ duration: 150 }}
>
    <div
        class="relative w-full {maxWidth} bg-[#12121a] border border-[rgba(0,255,255,0.3)] rounded-lg overflow-hidden"
        style="box-shadow: 0 0 40px rgba(0,255,255,0.15), 0 0 80px rgba(0,0,0,0.8);"
        transition:scale={{ start: 0.95, duration: 150 }}
    >
        {#if title}
            <div class="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,255,255,0.1)]">
                <h2 class="font-mono font-bold text-white uppercase tracking-wider text-sm">{title}</h2>
                <button
                    class="text-[#808090] hover:text-neon-cyan transition-colors text-xl leading-none"
                    onclick={close}
                >
                    ×
                </button>
            </div>
        {:else}
            <button
                class="absolute top-4 right-4 text-[#808090] hover:text-neon-cyan transition-colors text-xl leading-none z-10"
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
    </div>
</div>
