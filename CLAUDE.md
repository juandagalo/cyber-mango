# CLAUDE.md — Cyber Mango Web UI

## Project Overview

Web UI for **Cyber Mango**, a cyberpunk-themed kanban board managed by AI agents. Built with SvelteKit 2 + Svelte 5 + Tailwind CSS 3 + SQLite (Drizzle ORM). The companion Claude Code plugin provides MCP tools for programmatic board management.

## Quick Start

```bash
npm install
npm run dev          # Starts at http://localhost:5173
```

## Architecture

```
src/
├── lib/
│   ├── server/
│   │   ├── db/           # Drizzle schema, connection singleton, migrations, seed
│   │   ├── services/     # BoardService, ColumnService, CardService, TagService
│   │   ├── errors.ts     # AppError, NotFoundError, ValidationError, ConflictError
│   │   └── services.ts   # Singleton getServices() factory
│   ├── components/
│   │   ├── board/        # Board.svelte, Column.svelte, AddColumn.svelte, CardSearch.svelte
│   │   ├── card/         # Card.svelte, CardDetail.svelte, CardQuickAdd.svelte, PriorityBadge.svelte, PhaseBadge.svelte
│   │   ├── tag/          # TagBadge.svelte, TagPicker.svelte, TagManager.svelte, PhaseManager.svelte, PhaseTracker.svelte
│   │   └── ui/           # Modal.svelte, ConfirmDialog.svelte, EmptyState.svelte, Toast.svelte
│   ├── stores/           # board.ts (writable store), toast.ts
│   ├── types/            # board.ts (Board, Column, Card, Tag interfaces)
│   └── utils/            # position.ts (fractional indexing), api.ts (error handler)
├── routes/
│   ├── api/              # REST endpoints: boards, columns, cards, tags
│   ├── +layout.svelte    # Root layout with cyberpunk header
│   ├── +page.svelte      # Main board view
│   └── +page.server.ts   # SSR load
├── hooks.server.ts       # Runs migrations + seed on startup
└── app.css               # Cyberpunk design tokens + custom scrollbar
```

## Database

SQLite with Drizzle ORM. Connection uses WAL mode for concurrent access.

**DB path resolution** (in order):
1. `CYBER_MANGO_DB_PATH` env var
2. `DB_PATH` env var
3. Default: `~/.cyber-mango/kanban.db`

The Cyber Mango plugin and this web UI share the SAME database file. Both must point to the same path.

**Schema**: 6 tables — boards, columns, cards, tags, card_tags, activity_log (v2).
**IDs**: nanoid (12 chars). **Positions**: REAL (fractional indexing). **Timestamps**: ISO 8601 text.

## Commands

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run test           # Vitest (watch mode)
npm run test:run       # Vitest (single run)
npm run check          # svelte-check TypeScript validation
npm run db:generate    # Generate Drizzle migration SQL
npm run db:migrate     # Run migrations
```

## Code Conventions

### Svelte 5 Runes
- Use `$props()`, `$state()`, `$derived()`, `$effect()`. No legacy `export let` or `$:`.
- **`$derived` over `$effect`** for computed values. If a value is purely calculated from other state with no side effects, it MUST be `$derived`, never `$effect`. `$effect` is reserved for actual side effects: DOM manipulation, event listeners, API calls, timers.
- **Event handling** — callback props (`onclose`, `onrefresh`), NOT `createEventDispatcher`. Use `onclick` not `on:click`.
- **Slots** — `{@render children()}` with `Snippet` types, NOT `<slot />`.
- **Stores** — writable stores (`svelte/store`) still used for global state (board, toast). Compatible with Svelte 5.
- **Initial prop capture** — use `untrack()` when initializing `$state()` from props to avoid `state_referenced_locally` warnings.
- **All `<script>` tags** must have `lang="ts"`.

### CSS/Styling Discipline
- **ZERO `<style>` blocks** inside `.svelte` files. All CSS lives in `src/lib/styles/` (tokens.css, animations.css, utilities.css, base.css, modal.css, markdown.css).
- **No JS hover handlers**. Never use `onmouseenter`/`onmouseleave` to toggle inline styles for hover effects. Use CSS `:hover` pseudo-selectors via global utility classes (e.g., `.cyber-btn-yellow:hover`).
- **Inline `style=""` only for dynamic data-driven values** (e.g., `style="background: {column.color}"` where the color comes from the database). Static styles must be Tailwind classes or global CSS utility classes.
- **Use design tokens** (`var(--cyber-cyan)`, `var(--border-subtle)`) not raw rgba/hex values in styles.
- **Tailwind 3** (NOT v4) — standard `@tailwind base/components/utilities`.
- **Utility extraction**: repeated style patterns across components should be extracted to utility classes in `src/lib/styles/utilities.css`.
- **Shared helpers**: duplicated JS utility functions (like color conversions) go in `src/lib/utils/`, not copied per component.

### TypeScript
- **Strict mode**, zero `any` types. Use proper type guards for type narrowing.
- No type assertions (`as`) unless truly unavoidable, and always validate the data first.
- All callback props must be properly typed with specific interfaces, not `any`.

### Security
- **Never use `{@html}` with unsanitized content**. Any user-generated HTML (e.g., markdown rendered via `marked`) must be sanitized with DOMPurify before rendering.
- SQL injection is handled by Drizzle's parameterized queries, but always validate input types at the API boundary.

### Accessibility
- Do NOT suppress Svelte a11y warnings (`svelte-ignore a11y_*`) as a workaround. Fix the underlying issue by adding proper `role`, `tabindex`, and keyboard handlers.
- Modals must trap focus and have `aria-label` on close buttons.
- All interactive custom widgets must support keyboard navigation.

### API Routes
- Validate input at the API boundary before passing to services.
- Use the `handleError()` utility from `$lib/utils/api.ts` for consistent error responses.
- Services throw typed errors (NotFoundError, ValidationError, ConflictError); API routes map these to HTTP status codes.

### General
- **Services are synchronous** — better-sqlite3 is sync, no async/await in service methods
- **ESM only** — `"type": "module"` in package.json
- **Node.js >= 20** — required by better-sqlite3 v12+
- **Drizzle 0.45+** — array syntax for table extras: `(t) => [index(...)]`

## Cyberpunk Design System

All UI components follow the cyberpunk theme. Actual values in `src/lib/styles/tokens.css`:

| CSS Variable | Value | Usage |
|-------------|-------|-------|
| `--cyber-yellow` | `#FCEE0A` | Primary accent, borders, highlights |
| `--cyber-red` | `#c5003c` | Danger base |
| `--cyber-red-bright` | `#FF003C` | Critical priority, delete actions |
| `--cyber-cyan` | `#02D7F2` | Secondary accent, search, links |
| `--cyber-magenta` | `#ED1E79` | High priority |
| `--cyber-purple` | `#7700A6` | Phase/category colors |
| `--bg-deepest` | `#0D0D12` | Page background |
| `--bg-surface` | `#13131D` | Column/modal background |
| `--bg-card` | `#1A1A28` | Card background |
| `--bg-elevated` | `#1E1E30` | Hover elevation |
| `--text-primary` | `#D4D4D4` | Body text |
| `--text-heading` | `#ffffff` | Titles |
| `--text-muted` | `#6A6A7A` | Secondary/disabled text |
| `--border-subtle` | `rgba(252,238,10,0.08)` | Default borders |
| `--border-accent` | `rgba(252,238,10,0.25)` | Emphasized borders |

**Priority colors**: critical=`--cyber-red-bright` (pulse), high=`--cyber-magenta`, medium=`--cyber-yellow`, low=`--text-muted`
**Fonts**: `font-rajdhani` (titles, buttons, labels), `font-mono` (technical text, IDs, timestamps), `font-orbitron` (logo only)
**Effects**: Defined in `src/lib/styles/animations.css` (glitch, hover-sweep, border-pulse, accent-pulse, screen-scan, data-flicker, search materialize/dematerialize, card-search-highlight)
**Utilities**: Defined in `src/lib/styles/utilities.css` (clip-cyber, clip-cyber-sm, clip-cyber-xs, corner-brackets, scan-lines)

## Testing

- **77 unit tests** (Vitest) covering all 4 services + position utilities
- Tests use in-memory SQLite (`tests/helpers/db.ts`)
- Test pattern: real DB, no mocks

## Related

- **Plugin**: `cyber-mango-plugin` (separate repo) — Claude Code plugin with MCP server, skills, hooks
- **Shared DB**: `~/.cyber-mango/kanban.db` — both projects read/write here
