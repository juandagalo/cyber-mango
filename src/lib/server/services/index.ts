import type { DrizzleDb } from '../db/connection.js';
import { BoardService } from './board.service.js';
import { ColumnService } from './column.service.js';
import { CardService } from './card.service.js';
import { TagService } from './tag.service.js';
import { PhaseService } from './phase.service.js';

export function createServices(db: DrizzleDb) {
    return {
        boards: new BoardService(db),
        columns: new ColumnService(db),
        cards: new CardService(db),
        tags: new TagService(db),
        phases: new PhaseService(db),
    };
}

export type Services = ReturnType<typeof createServices>;

export { BoardService } from './board.service.js';
export { ColumnService } from './column.service.js';
export { CardService } from './card.service.js';
export { TagService } from './tag.service.js';
export { PhaseService } from './phase.service.js';
