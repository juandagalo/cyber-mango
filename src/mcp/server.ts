import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getDb } from '../lib/server/db/connection.js';
import { runMigrations } from '../lib/server/db/migrate.js';
import { createServices } from '../lib/server/services/index.js';
import { AppError, NotFoundError } from '../lib/server/errors.js';

type Services = ReturnType<typeof createServices>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveBoard(services: Services, boardId?: string): string {
    if (boardId) return boardId;
    const boards = services.boards.listBoards();
    if (boards.length === 0) throw new Error('No boards found');
    return boards[0].id;
}

function resolveColumn(
    services: Services,
    boardId: string,
    columnId?: string,
    columnName?: string
): string {
    if (columnId) return columnId;
    if (columnName) {
        const board = services.boards.getBoard(boardId);
        const col = board.columns.find(
            (c) => c.name.toLowerCase() === columnName.toLowerCase()
        );
        if (!col) throw new NotFoundError('Column', columnName);
        return col.id;
    }
    // Default to first column
    const board = services.boards.getBoard(boardId);
    if (board.columns.length === 0) throw new Error('Board has no columns');
    return board.columns[0].id;
}

function ok(data: unknown) {
    return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
}

function err(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
        content: [{ type: 'text' as const, text: message }],
        isError: true as const,
    };
}

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export async function startMcpServer() {
    // Run migrations before doing anything else
    runMigrations();

    const services = createServices(getDb());

    // Guarantee a board exists
    services.boards.ensureDefaultBoard();

    const server = new McpServer({
        name: 'kanban-board',
        version: '1.0.0',
    });

    // -----------------------------------------------------------------------
    // Tool 1: list_boards
    // -----------------------------------------------------------------------
    server.tool('list_boards', 'List all kanban boards', {}, async () => {
        try {
            const boards = services.boards.listBoards();
            return ok(boards);
        } catch (e) {
            if (e instanceof AppError) return err(e);
            throw e;
        }
    });

    // -----------------------------------------------------------------------
    // Tool 2: get_board
    // -----------------------------------------------------------------------
    server.tool(
        'get_board',
        'Get a board with all its columns and cards',
        { board_id: z.string().optional() },
        async ({ board_id }) => {
            try {
                const boardId = resolveBoard(services, board_id);
                const board = services.boards.getBoard(boardId);
                return ok(board);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 3: get_board_summary
    // -----------------------------------------------------------------------
    server.tool(
        'get_board_summary',
        'Get a summary of a board (card counts by column and priority)',
        { board_id: z.string().optional() },
        async ({ board_id }) => {
            try {
                const boardId = resolveBoard(services, board_id);
                const summary = services.boards.getBoardSummary(boardId);
                return ok(summary);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 4: create_task
    // -----------------------------------------------------------------------
    server.tool(
        'create_task',
        'Create a new task card on the kanban board',
        {
            title: z.string(),
            column_id: z.string().optional(),
            column_name: z.string().optional(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        },
        async ({ title, column_id, column_name, description, priority }) => {
            try {
                const boardId = resolveBoard(services);
                const columnId = resolveColumn(services, boardId, column_id, column_name);
                const card = services.cards.create({
                    columnId,
                    title,
                    description,
                    priority,
                });
                return ok(card);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 5: update_task
    // -----------------------------------------------------------------------
    server.tool(
        'update_task',
        'Update a task card title, description, or priority',
        {
            card_id: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        },
        async ({ card_id, title, description, priority }) => {
            try {
                const card = services.cards.update(card_id, { title, description, priority });
                return ok(card);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 6: move_task
    // -----------------------------------------------------------------------
    server.tool(
        'move_task',
        'Move a task card to a different column or position',
        {
            card_id: z.string(),
            column_id: z.string().optional(),
            column_name: z.string().optional(),
            position: z.number().optional(),
        },
        async ({ card_id, column_id, column_name, position }) => {
            try {
                const boardId = resolveBoard(services);
                const columnId = resolveColumn(services, boardId, column_id, column_name);

                let targetPosition = position;
                if (targetPosition === undefined) {
                    // Append at the end: max existing position + 1
                    const board = services.boards.getBoard(boardId);
                    const col = board.columns.find((c) => c.id === columnId);
                    const maxPos = col?.cards.reduce((m, c) => Math.max(m, c.position), 0) ?? 0;
                    targetPosition = maxPos + 1;
                }

                const card = services.cards.move(card_id, {
                    columnId,
                    position: targetPosition,
                });
                return ok(card);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 7: delete_task
    // -----------------------------------------------------------------------
    server.tool(
        'delete_task',
        'Delete a task card from the board',
        { card_id: z.string() },
        async ({ card_id }) => {
            try {
                services.cards.delete(card_id);
                return ok({ deleted: true, card_id });
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 8: create_column
    // -----------------------------------------------------------------------
    server.tool(
        'create_column',
        'Create a new column on a kanban board',
        {
            name: z.string(),
            board_id: z.string().optional(),
            color: z.string().optional(),
            wip_limit: z.number().optional(),
        },
        async ({ name, board_id, color, wip_limit }) => {
            try {
                const boardId = resolveBoard(services, board_id);
                const column = services.columns.create({
                    boardId,
                    name,
                    color,
                    wipLimit: wip_limit,
                });
                return ok(column);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Tool 9: update_column
    // -----------------------------------------------------------------------
    server.tool(
        'update_column',
        'Update a column name, color, or WIP limit',
        {
            column_id: z.string(),
            name: z.string().optional(),
            color: z.string().optional(),
            wip_limit: z.number().optional(),
        },
        async ({ column_id, name, color, wip_limit }) => {
            try {
                const column = services.columns.update(column_id, {
                    name,
                    color,
                    wipLimit: wip_limit,
                });
                return ok(column);
            } catch (e) {
                if (e instanceof AppError) return err(e);
                throw e;
            }
        }
    );

    // -----------------------------------------------------------------------
    // Start
    // -----------------------------------------------------------------------
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Kanban MCP server running on stdio');
}
