<script>
  import '../app.css';

  let { children } = $props();
</script>

<div class="h-screen flex flex-col bg-[#0a0a0f] text-[#e0e0e0] font-mono overflow-hidden">
  <header class="flex-shrink-0 border-b border-[rgba(0,255,255,0.1)] px-6 py-3 flex items-center justify-between">
    <h1 class="font-['Orbitron'] text-xl font-bold text-neon-cyan tracking-wider uppercase">
      CYBER<span class="text-neon-magenta">::</span>MANGO
    </h1>
    <div class="text-xs text-[#808090]">
      SYSTEM ONLINE
    </div>
  </header>
  <main class="flex-1 min-h-0 overflow-hidden">
    {@render children()}
  </main>
</div>
