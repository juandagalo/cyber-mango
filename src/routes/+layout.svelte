<script lang="ts">
  import '../app.css';
  import '$lib/styles/tokens.css';
  import '$lib/styles/base.css';
  import '$lib/styles/utilities.css';
  import '$lib/styles/animations.css';
  import '$lib/styles/modal.css';
  import '$lib/styles/markdown.css';
  import { onMount } from 'svelte';

  let { children } = $props();

  let timeStr = $state('--:--');
  let frameCount = $state(0);

  onMount(() => {
    function updateTime() {
      const now = new Date();
      timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Frame counter — cycles for HUD feel
    const frameInterval = setInterval(() => {
      frameCount = (frameCount + 1) % 9999;
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(frameInterval);
    };
  });
</script>

<div class="h-screen flex flex-col bg-cyber-dark text-[#D4D4D4] overflow-hidden relative scan-lines screen-scan">
  <header class="flex-shrink-0 px-5 py-2.5 flex items-center justify-between relative"
    style="background: linear-gradient(90deg, rgba(197,0,60,0.08) 0%, transparent 50%, rgba(252,238,10,0.05) 100%);
           border-bottom: 1px solid rgba(252,238,10,0.15);">

    <!-- Left: Logo -->
    <div class="flex items-center gap-4">
      <h1 class="glitch-text font-orbitron text-xl font-black tracking-[0.2em] uppercase select-none"
          data-text="CYBER::MANGO"
          style="color: var(--cyber-yellow); text-shadow: 0 0 20px rgba(252,238,10,0.4), 0 0 40px rgba(252,238,10,0.1);">
        CYBER<span style="color: var(--cyber-red-bright);">::</span>MANGO
      </h1>
      <div class="h-4 w-px bg-[rgba(252,238,10,0.2)]"></div>
      <span class="font-rajdhani text-[11px] font-medium tracking-[0.15em] uppercase data-flicker-alt"
            style="color: var(--cyber-red);">
        // NIGHT CITY OS v2.0.77
      </span>
    </div>

    <!-- Right: HUD status -->
    <div class="flex items-center gap-4 font-mono text-[10px] tracking-wider">
      <span class="text-[var(--text-muted)]">SYS.TIME</span>
      <span class="data-flicker" style="color: var(--cyber-cyan);">{timeStr}</span>
      <div class="h-3 w-px bg-[rgba(252,238,10,0.15)]"></div>
      <span class="text-[var(--text-muted)]">FRM</span>
      <span class="data-flicker-alt" style="color: var(--text-muted);">{String(frameCount).padStart(4, '0')}</span>
      <div class="h-3 w-px bg-[rgba(252,238,10,0.15)]"></div>
      <span class="text-[var(--text-muted)]">STATUS</span>
      <span class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: #39FF14; box-shadow: 0 0 4px #39FF14;"></span>
        <span style="color: #39FF14;">ONLINE</span>
      </span>
    </div>

    <!-- Bottom accent line — animated gradient sweep -->
    <div class="absolute bottom-0 left-0 right-0 h-px gradient-line-sweep" style="opacity: 0.5;"></div>
  </header>

  <main class="flex-1 min-h-0 overflow-hidden">
    {@render children()}
  </main>
</div>
