<script lang="ts">
    import { tick, untrack } from 'svelte';
    import type { ColumnWithCards, CardWithTags } from '$lib/types/board.js';

    let { columns, modalOpen = false, onfound }: {
        columns: ColumnWithCards[];
        modalOpen?: boolean;
        onfound?: (card: CardWithTags) => void;
    } = $props();

    type SearchResult = CardWithTags & {
        columnName: string;
        columnColor: string | null;
        matchTier: number;
    };

    let query = $state('');
    let highlightedIndex = $state(-1);
    let expanded = $state(false);
    let materializing = $state(false);
    let dematerializing = $state(false);
    let inputEl = $state<HTMLInputElement | undefined>(undefined);

    const results = $derived.by((): SearchResult[] => {
        const q = query.trim();
        if (!q) return [];

        const qLower = q.toLowerCase();
        const flat: SearchResult[] = [];

        for (const col of columns) {
            for (const card of col.cards) {
                const titleLower = card.title.toLowerCase();
                let matchTier = 0;

                if (titleLower === qLower) {
                    matchTier = 1;
                } else if (titleLower.startsWith(qLower)) {
                    matchTier = 2;
                } else if (titleLower.includes(qLower)) {
                    matchTier = 3;
                } else if (card.id.startsWith(q)) {
                    matchTier = 2;
                } else {
                    continue;
                }

                flat.push({
                    ...card,
                    columnName: col.name,
                    columnColor: col.color,
                    matchTier
                });
            }
        }

        flat.sort((a, b) => {
            if (a.matchTier !== b.matchTier) return a.matchTier - b.matchTier;
            return a.title.localeCompare(b.title);
        });

        return flat.slice(0, 8);
    });

    const isOpen = $derived(query.trim().length > 0);

    $effect(() => {
        // Read results.length to declare the dependency, then reset highlight index
        results.length;
        untrack(() => { highlightedIndex = -1; });
    });

    async function openSearch() {
        if (expanded) {
            inputEl?.focus();
            return;
        }
        materializing = true;
        expanded = true;
        await tick();
        inputEl?.focus();
        setTimeout(() => { materializing = false; }, 500);
    }

    function closeSearch() {
        if (dematerializing) return;
        query = '';
        highlightedIndex = -1;
        dematerializing = true;
        setTimeout(() => {
            expanded = false;
            dematerializing = false;
            materializing = false;
        }, 300);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (isOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = results.length > 0 ? (highlightedIndex + 1) % results.length : -1;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex = results.length > 0
                    ? (highlightedIndex <= 0 ? results.length - 1 : highlightedIndex - 1)
                    : -1;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
                if (results[idx]) selectResult(results[idx]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                query = '';
                highlightedIndex = -1;
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeSearch();
        }
    }

    function selectResult(result: SearchResult) {
        const card: CardWithTags = {
            id: result.id,
            columnId: result.columnId,
            title: result.title,
            description: result.description,
            priority: result.priority,
            position: result.position,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            tags: result.tags,
            phase: result.phase
        };
        query = '';
        highlightedIndex = -1;
        dematerializing = true;
        setTimeout(() => {
            expanded = false;
            dematerializing = false;
            materializing = false;
            onfound?.(card);
        }, 300);
    }

    function clearQuery() {
        query = '';
        highlightedIndex = -1;
        inputEl?.focus();
    }

    function handleBlur(e: FocusEvent) {
        const container = (e.currentTarget as HTMLElement)?.closest('[role="search"]');
        setTimeout(() => {
            if (container && !container.contains(document.activeElement) && !query.trim()) {
                closeSearch();
            }
        }, 200);
    }

    $effect(() => {
        function onWindowKeydown(e: KeyboardEvent) {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const trigger = isMac ? e.metaKey : e.ctrlKey;
            if (trigger && e.key === 'k') {
                if (modalOpen) return;
                e.preventDefault();
                openSearch();
            }
        }

        window.addEventListener('keydown', onWindowKeydown);
        return () => window.removeEventListener('keydown', onWindowKeydown);
    });

    const activeDescendant = $derived(
        highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
    );
</script>

<div class="relative" role="search">
    {#if !expanded}
        <!-- Collapsed: search trigger button -->
        <button
            class="clip-cyber-xs group flex items-center gap-2 px-3 py-1.5 relative border cyber-hover-search-trigger"
            onclick={openSearch}
        >
            <!-- Corner cuts -->
            <span class="absolute top-0 left-0 w-1.5 h-1.5 pointer-events-none search-corner-tl"></span>
            <span class="absolute bottom-0 right-0 w-1.5 h-1.5 pointer-events-none search-corner-br"></span>

            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" class="flex-shrink-0">
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.2"/>
                <line x1="7.9" y1="7.9" x2="11" y2="11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <span class="text-[10px] font-rajdhani font-semibold uppercase tracking-[0.12em]">Search</span>
            <span class="text-[9px] font-mono px-1 py-px ml-1 search-kbd">
                ^K
            </span>
        </button>
    {:else}
        <!-- Expanded: search input with materialize/dematerialize animation -->
        <div class="search-expanded"
             class:materializing
             class:dematerializing>

            <!-- Scan line sweep (one-shot on materialize) -->
            {#if materializing}
                <span class="search-scanline"></span>
            {/if}

            <div class="relative flex items-center search-input-wrapper">

                <!-- Corner brackets -->
                <span class="absolute left-0 top-0 w-2 h-2 pointer-events-none search-corner-tl-full"></span>
                <span class="absolute right-0 top-0 w-2 h-2 pointer-events-none search-corner-tr-full"></span>
                <span class="absolute left-0 bottom-0 w-2 h-2 pointer-events-none search-corner-bl-full"></span>
                <span class="absolute right-0 bottom-0 w-2 h-2 pointer-events-none search-corner-br-full"></span>

                <!-- Magnifying glass -->
                <span class="pl-2.5 pr-1 flex-shrink-0 text-cyber-cyan opacity-60" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.2"/>
                        <line x1="7.9" y1="7.9" x2="11" y2="11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                </span>

                <input
                    bind:this={inputEl}
                    bind:value={query}
                    type="text"
                    placeholder="Search cards..."
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls="card-search-listbox"
                    aria-activedescendant={activeDescendant}
                    aria-label="Search cards"
                    class="flex-1 bg-transparent text-xs font-mono text-white py-1.5 px-1 focus:outline-none placeholder:text-[var(--text-muted)] min-w-0"
                    onkeydown={handleKeydown}
                    onblur={handleBlur}
                />

                {#if query.length > 0}
                    <button
                        class="flex-shrink-0 px-2 py-1 text-[10px] font-mono cyber-hover-text-cyan"
                        onclick={clearQuery}
                        aria-label="Clear search"
                        tabindex="-1"
                    >
                        ×
                    </button>
                {:else}
                    <button
                        class="flex-shrink-0 px-1.5 py-0.5 mr-1 text-[9px] font-mono border cyber-hover-esc"
                        onclick={closeSearch}
                        aria-label="Close search"
                        tabindex="-1"
                    >
                        ESC
                    </button>
                {/if}
            </div>
        </div>

        <!-- Dropdown results -->
        {#if isOpen}
            <div
                id="card-search-listbox"
                role="listbox"
                aria-label="Search results"
                class="absolute top-full left-0 right-0 z-30 overflow-hidden mt-0.5 cyber-search-results"
            >
                {#if results.length === 0}
                    <div class="px-3 py-2 text-[10px] font-mono glitch-text search-no-match"
                         data-text="NO MATCH FOUND">
                        NO MATCH FOUND
                    </div>
                {:else}
                    {#each results as result, i (result.id)}
                        <div
                            id="search-result-{i}"
                            role="option"
                            tabindex="-1"
                            aria-selected={highlightedIndex === i}
                            class="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors relative"
                            style="background: {highlightedIndex === i ? 'rgba(0,255,255,0.05)' : 'transparent'};"
                            onmouseenter={() => { highlightedIndex = i; }}
                            onclick={() => selectResult(result)}
                            onkeydown={(e) => e.key === 'Enter' && selectResult(result)}
                        >
                            {#if highlightedIndex === i}
                                <span class="absolute left-0 top-0 bottom-0 w-[2px] bg-cyber-cyan"></span>
                            {/if}

                            <span
                                class="flex-shrink-0 w-2 h-2 rounded-full"
                                style="background: {result.columnColor ?? 'var(--cyber-cyan)'};"
                            ></span>

                            <span class="flex-1 text-xs font-rajdhani font-semibold truncate"
                                  style="color: {highlightedIndex === i ? 'var(--cyber-cyan)' : 'var(--text-primary)'};">
                                {result.title}
                            </span>

                            <span class="flex-shrink-0 text-[9px] font-mono text-cyber-muted">
                                {result.id.slice(0, 8)} &middot; {result.columnName}
                            </span>
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}
    {/if}
</div>

