<script lang="ts">
    import type { Priority } from '$lib/types/board.js';

    let { priority }: { priority: Priority } = $props();

    const config: Record<Priority, { label: string; color: string; glow: string; pulse: boolean }> = {
        critical: {
            label: 'CRITICAL',
            color: '#FF0040',
            glow: 'rgba(255,0,64,0.5)',
            pulse: true
        },
        high: {
            label: 'HIGH',
            color: '#FF00FF',
            glow: 'rgba(255,0,255,0.4)',
            pulse: false
        },
        medium: {
            label: 'MED',
            color: '#00FFFF',
            glow: 'rgba(0,255,255,0.4)',
            pulse: false
        },
        low: {
            label: 'LOW',
            color: '#404060',
            glow: 'transparent',
            pulse: false
        }
    };

    const cfg = $derived(config[priority]);
</script>

<span
    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
    class:animate-pulse={cfg.pulse}
    style="
        color: {cfg.color};
        border: 1px solid {cfg.color};
        background: {cfg.color}18;
        {cfg.pulse ? `box-shadow: 0 0 6px ${cfg.glow};` : ''}
    "
>
    {cfg.label}
</span>
