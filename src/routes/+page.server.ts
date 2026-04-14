import type { PageServerLoad } from './$types';
import { getServices } from '$lib/server/services.js';

export const load: PageServerLoad = async () => {
    const services = getServices();
    const boardList = services.boards.listBoards();

    if (boardList.length === 0) {
        return { board: null };
    }

    const board = services.boards.getBoard(boardList[0].id);
    return { board };
};
