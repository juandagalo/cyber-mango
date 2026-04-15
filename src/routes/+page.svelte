<script lang="ts">
    import type { PageData } from './$types';
    import { boardStore } from '$lib/stores/board.js';
    import Board from '$lib/components/board/Board.svelte';
    import Toast from '$lib/components/ui/Toast.svelte';
    import { onMount } from 'svelte';

    let { data }: { data: PageData } = $props();

    onMount(() => {
        if (data.board) {
            boardStore.set(data.board);
        }
    });

    $effect(() => {
        if (data.board) {
            boardStore.set(data.board);
        }
    });
</script>

<Toast />

{#if $boardStore}
    <Board board={$boardStore} />
{:else}
    <div class="flex items-center justify-center h-full flex-col gap-4">
        <div class="w-12 h-12 border border-[rgba(0,255,255,0.2)] rounded-lg flex items-center justify-center">
            <span class="text-neon-cyan text-2xl">⚡</span>
        </div>
        <p class="text-[#808090] text-sm font-mono uppercase tracking-wider">
            {data.board === null ? 'Initializing board...' : 'No board found'}
        </p>
    </div>
{/if}
