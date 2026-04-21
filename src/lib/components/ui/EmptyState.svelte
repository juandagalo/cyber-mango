<script lang="ts">
    let { message = 'No cards yet' }: { message?: string } = $props();
</script>

<div class="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div class="w-10 h-10 border border-dashed flex items-center justify-center mb-3 cyber-border-base">
        <span class="text-lg text-cyber-muted">+</span>
    </div>
    <p class="text-xs font-rajdhani font-semibold uppercase tracking-[0.12em] text-cyber-muted">{message}</p>
</div>
