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
│   │   ├── board/        # Board.svelte, Column.svelte, AddColumn.svelte
│   │   ├── card/         # Card.svelte, CardDetail.svelte, CardQuickAdd.svelte, PriorityBadge.svelte
│   │   ├── tag/          # TagBadge.svelte, TagPicker.svelte, TagManager.svelte
│   │   └── ui/           # Modal.svelte, ConfirmDialog.svelte, EmptyState.svelte, Toast.svelte
│   ├── stores/           # board.ts (writable store), toast.ts
│   ├── types/            # board.ts (Board, Column, Card, Tag interfaces)
│   └── utils/            # position.ts (fractional indexing), api.ts (error handler)
├── routes/
│   ├── api/              # REST endpoints: boards, columns, cards, tags
│   ├── +layout.svelte    # Root layout with cyberpunk header
│   ├── +page.svelte      # Main board view
│   └── +page.server.ts   # SSR load
├── mcp/                  # MCP server (also available as standalone plugin)
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

- **Svelte 5 runes** — use `$props()`, `$state()`, `$derived()`, `$effect()`. No legacy `export let` or `$:`.
- **Event handling** — callback props (`onclose`, `onrefresh`), NOT `createEventDispatcher`. Use `onclick` not `on:click`.
- **Slots** — `{@render children()}` with `Snippet` types, NOT `<slot />`.
- **Stores** — writable stores (`svelte/store`) still used for global state (board, toast). Compatible with Svelte 5.
- **Initial prop capture** — use `untrack()` when initializing `$state()` from props to avoid `state_referenced_locally` warnings.
- **Tailwind 3** (NOT v4) — standard `@tailwind base/components/utilities`
- **TypeScript strict mode**
- **Services are synchronous** — better-sqlite3 is sync, no async/await in service methods
- **ESM only** — `"type": "module"` in package.json
- **Node.js >= 20** — required by better-sqlite3 v12+
- **Drizzle 0.45+** — array syntax for table extras: `(t) => [index(...)]`

## Cyberpunk Design System

All UI components follow the cyberpunk theme:

| Token | Value |
|-------|-------|
| bg-deepest | `#0a0a0f` |
| bg-surface | `#12121a` |
| bg-card | `#1a1a2e` |
| bg-elevated | `#16213e` |
| neon-cyan | `#00FFFF` |
| neon-magenta | `#FF00FF` |
| neon-purple | `#BF00FF` |
| neon-green | `#39FF14` |
| neon-red | `#FF0040` |
| text-primary | `#e0e0e0` |
| text-muted | `#808090` |

**Priority colors**: critical=#FF0040 (pulse), high=#FF00FF, medium=#00FFFF, low=#404060
**Fonts**: JetBrains Mono (body), Orbitron (headings)
**Effects**: Neon glow on hover, backdrop-blur on modals, gradient scrollbars

## Testing

- **77 unit tests** (Vitest) covering all 4 services + position utilities
- Tests use in-memory SQLite (`tests/helpers/db.ts`)
- Test pattern: real DB, no mocks

## Related

- **Plugin**: `cyber-mango-plugin` (separate repo) — Claude Code plugin with MCP server, skills, hooks
- **Shared DB**: `~/.cyber-mango/kanban.db` — both projects read/write here
