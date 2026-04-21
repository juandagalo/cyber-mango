<script lang="ts">
    import type { Phase } from '$lib/types/board.js';
    import { hexToRgb } from '$lib/utils/color.js';

    let { phases, currentPhaseId, onchange }: {
        phases: Phase[];
        currentPhaseId: string | null;
        onchange?: (phaseId: string | null) => void;
    } = $props();

    const currentIndex = $derived(
        currentPhaseId ? phases.findIndex(p => p.id === currentPhaseId) : -1
    );

    const currentPhase = $derived(
        currentPhaseId ? phases.find(p => p.id === currentPhaseId) ?? null : null
    );
</script>

<div class="flex flex-col gap-2">
    <span class="text-[10px] font-rajdhani font-semibold uppercase tracking-[0.12em] text-cyber-muted">// Phase</span>

    {#if phases.length === 0}
        <span class="text-xs font-mono text-cyber-muted">No phases defined</span>
    {:else}
        <div class="flex gap-0.5">
            {#each phases as phase, i (phase.id)}
                {@const rgb = hexToRgb(phase.color)}
                {@const isActive = phase.id === currentPhaseId}
                {@const isPast = currentIndex >= 0 && i < currentIndex}
                <button
                    class="flex-1 h-6 transition-all duration-150 relative group"
                    style="
                        background: {isActive ? `rgba(${rgb}, 0.80)` : isPast ? `rgba(${rgb}, 0.20)` : 'transparent'};
                        border: 1px solid {isActive ? phase.color : isPast ? `rgba(${rgb}, 0.3)` : 'rgba(255,255,255,0.08)'};
                        {isActive ? `box-shadow: 0 0 8px rgba(${rgb}, 0.5);` : ''}
                        {i === 0 ? 'border-radius: 2px 0 0 2px;' : i === phases.length - 1 ? 'border-radius: 0 2px 2px 0;' : ''}
                    "
                    title={phase.name}
                    onclick={() => onchange?.(isActive ? null : phase.id)}
                >
                    <span
                        class="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                        style="color: {isActive || isPast ? phase.color : 'var(--text-muted)'};"
                    >
                        {phase.name.length > 8 ? phase.name.slice(0, 7) + '…' : phase.name}
                    </span>
                </button>
            {/each}
        </div>

        <div class="flex items-center justify-between">
            {#if currentPhase}
                <span class="text-xs font-rajdhani font-semibold" style="color: {currentPhase.color};">
                    {currentPhase.name}
                </span>
                <button
                    class="text-[10px] font-mono px-1 cyber-hover-muted-red"
                    title="Unassign phase"
                    onclick={() => onchange?.(null)}
                >
                    x
                </button>
            {:else}
                <span class="text-xs font-rajdhani text-cyber-muted">Unassigned</span>
            {/if}
        </div>
    {/if}
</div>
