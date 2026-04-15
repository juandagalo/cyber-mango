<script lang="ts">
    let { message = 'No cards yet' }: { message?: string } = $props();
</script>

<div class="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div class="w-10 h-10 border border-dashed border-[rgba(0,255,255,0.2)] rounded flex items-center justify-center mb-3">
        <span class="text-[#808090] text-lg">+</span>
    </div>
    <p class="text-[#808090] text-xs font-mono uppercase tracking-wider">{message}</p>
</div>
