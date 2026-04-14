# Cyber Mango

A cyberpunk-themed kanban board designed to be managed by AI agents via MCP (Model Context Protocol) and viewed by humans via a web UI.

## What is this?

Cyber Mango is a task tracking system with two interfaces:

- **Web UI** (this repo) — A SvelteKit app with drag-and-drop kanban board, card detail modals, tag management, and a full cyberpunk visual design.
- **Claude Code Plugin** (separate repo) — An MCP server that exposes board management tools so Claude Code can create, move, and update cards programmatically.

Both share the same SQLite database, so changes from either interface are immediately visible in the other.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 4 |
| Language | TypeScript (strict) |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS 3 |
| Drag & Drop | svelte-dnd-action |
| Fonts | JetBrains Mono, Orbitron |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` to see the board.

On first run, a default board is created with 5 columns: Backlog, To Do, In Progress, Review, Done.

## Database Location

The SQLite database is shared between the web UI and the Claude Code plugin. The path is resolved in this order:

1. `CYBER_MANGO_DB_PATH` environment variable
2. `DB_PATH` environment variable
3. Default: `~/.cyber-mango/kanban.db`

## Features

- Kanban board with customizable columns
- Card creation, editing, drag-and-drop between columns
- Priority levels: critical, high, medium, low
- Tag system with color coding
- Card detail modal with auto-save
- Column management (rename, color, WIP limits, delete)
- Full REST API at `/api/*`
- MCP server with 9 tools for agent integration
- Cyberpunk design with neon colors, glow effects, and custom scrollbars

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests (watch) |
| `npm run test:run` | Run tests (once) |
| `npm run check` | TypeScript/Svelte validation |
| `npm run db:generate` | Generate migration SQL |
| `npm run db:migrate` | Run database migrations |

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/boards` | List boards |
| GET | `/api/boards/[id]` | Get board with columns and cards |
| GET | `/api/boards/[id]/summary` | Board summary with counts |
| POST | `/api/columns` | Create column |
| PATCH | `/api/columns/[id]` | Update column |
| DELETE | `/api/columns/[id]` | Delete column |
| POST | `/api/cards` | Create card |
| GET | `/api/cards/[id]` | Get card with tags |
| PATCH | `/api/cards/[id]` | Update card |
| DELETE | `/api/cards/[id]` | Delete card |
| POST | `/api/cards/[id]/move` | Move card to column |
| POST | `/api/cards/[id]/tags/[tagId]` | Assign tag |
| DELETE | `/api/cards/[id]/tags/[tagId]` | Remove tag |
| GET | `/api/tags?boardId=X` | List tags |
| POST | `/api/tags` | Create tag |
| PATCH | `/api/tags/[id]` | Update tag |
| DELETE | `/api/tags/[id]` | Delete tag |

## License

MIT
