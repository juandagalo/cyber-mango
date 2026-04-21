<script lang="ts">
    import type { Snippet } from 'svelte';
    import { onMount, onDestroy } from 'svelte';

    let { title = '', maxWidth = 'max-w-2xl', onclose, children }: {
        title?: string;
        maxWidth?: string;
        onclose?: () => void;
        children?: Snippet;
    } = $props();

    let visible = $state(false);
    let closing = $state(false);

    function close() {
        closing = true;
        setTimeout(() => {
            onclose?.();
        }, 300);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') close();
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    onMount(() => {
        // Trigger enter animation on next frame
        requestAnimationFrame(() => { visible = true; });
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.8);
           animation: {closing ? 'cyber-backdrop-out' : 'cyber-backdrop-in'} {closing ? '0.25s' : '0.35s'} ease-out forwards;"
    onclick={handleBackdropClick}
    role="presentation"
>
    <div
        class="relative w-full {maxWidth} overflow-hidden"
        style="background: var(--bg-surface);
               border: 1px solid rgba(252,238,10,0.2);
               box-shadow: 0 0 40px rgba(252,238,10,0.08), 0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(252,238,10,0.05);
               animation: {closing ? 'cyber-modal-out 0.3s ease-in forwards' : 'cyber-modal-in 0.4s ease-out forwards'},
                          {closing ? 'none' : 'border-flash-in 0.6s ease-out'};"
    >
        <!-- Traveling border lights — energy flowing around the perimeter -->
        <div class="border-line-travel border-line-top"></div>
        <div class="border-line-travel border-line-right"></div>
        <div class="border-line-travel border-line-bottom"></div>
        <div class="border-line-travel border-line-left"></div>

        <!-- One-shot scan line on open -->
        {#if visible && !closing}
            <div class="absolute left-0 w-full h-[2px] pointer-events-none z-20"
                 style="background: linear-gradient(90deg, transparent 10%, rgba(252,238,10,0.4) 50%, transparent 90%);
                        box-shadow: 0 0 8px rgba(252,238,10,0.2);
                        animation: modal-scan-once 0.6s ease-out 0.3s forwards;
                        opacity: 0;">
            </div>
        {/if}

        <!-- Corner brackets for the modal -->
        <div class="corner-brackets absolute inset-3 pointer-events-none z-10"></div>

        {#if title}
            <div class="flex items-center justify-between px-6 py-3"
                 style="border-bottom: 1px solid rgba(252,238,10,0.1); background: rgba(252,238,10,0.02);">
                <h2 class="font-rajdhani font-bold text-white uppercase tracking-[0.12em] text-sm">// {title}</h2>
                <button
                    class="text-xl leading-none cyber-hover-muted"
                    aria-label="Close dialog"
                    onclick={close}
                >
                    ×
                </button>
            </div>
        {:else}
            <button
                class="absolute top-4 right-4 text-xl leading-none z-10 cyber-hover-muted"
                aria-label="Close dialog"
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
