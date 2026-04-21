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
    let modalEl: HTMLDivElement | undefined = $state();

    const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function getFocusable(): HTMLElement[] {
        if (!modalEl) return [];
        return Array.from(modalEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    }

    function close() {
        closing = true;
        setTimeout(() => {
            onclose?.();
        }, 300);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            close();
            return;
        }
        if (e.key === 'Tab') {
            const focusable = getFocusable();
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    let previouslyFocused: HTMLElement | null = null;

    onMount(() => {
        previouslyFocused = document.activeElement as HTMLElement | null;
        // Trigger enter animation on next frame, then focus first focusable element
        requestAnimationFrame(() => {
            visible = true;
            const focusable = getFocusable();
            if (focusable.length > 0) focusable[0].focus();
        });
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
        previouslyFocused?.focus();
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 cyber-backdrop"
    class:cyber-backdrop-enter={!closing}
    class:cyber-backdrop-exit={closing}
    onclick={handleBackdropClick}
    role="presentation"
>
    <div
        bind:this={modalEl}
        class="relative w-full {maxWidth} overflow-hidden cyber-modal-panel"
        class:cyber-modal-enter={!closing}
        class:cyber-modal-exit={closing}
    >
        <!-- Traveling border lights - energy flowing around the perimeter -->
        <div class="border-line-travel border-line-top"></div>
        <div class="border-line-travel border-line-right"></div>
        <div class="border-line-travel border-line-bottom"></div>
        <div class="border-line-travel border-line-left"></div>

        <!-- One-shot scan line on open -->
        {#if visible && !closing}
            <div class="absolute left-0 w-full h-[2px] pointer-events-none z-20 modal-scan-line"></div>
        {/if}

        <!-- Corner brackets for the modal -->
        <div class="corner-brackets absolute inset-3 pointer-events-none z-10"></div>

        {#if title}
            <div class="flex items-center justify-between px-6 py-3 modal-header">
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
