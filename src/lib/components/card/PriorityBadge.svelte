<script lang="ts">
    import type { Priority } from '$lib/types/board.js';

    let { priority }: { priority: Priority } = $props();

    const config: Record<Priority, { label: string; color: string; glow: string; pulse: boolean }> = {
        critical: {
            label: 'CRITICAL',
            color: '#FF003C',
            glow: 'rgba(255,0,60,0.5)',
            pulse: true
        },
        high: {
            label: 'HIGH',
            color: '#ED1E79',
            glow: 'rgba(237,30,121,0.4)',
            pulse: false
        },
        medium: {
            label: 'MED',
            color: '#FCEE0A',
            glow: 'rgba(252,238,10,0.3)',
            pulse: false
        },
        low: {
            label: 'LOW',
            color: '#6A6A7A',
            glow: 'transparent',
            pulse: false
        }
    };

    const cfg = $derived(config[priority]);
</script>

<span
    class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-rajdhani font-bold uppercase tracking-wider"
    class:animate-pulse={cfg.pulse}
    style="
        color: {cfg.color};
        border: 1px solid {cfg.color};
        background: {cfg.color}15;
        {cfg.pulse ? `box-shadow: 0 0 6px ${cfg.glow};` : ''}
    "
>
    {cfg.label}
</span>
