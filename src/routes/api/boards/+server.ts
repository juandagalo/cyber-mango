import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const GET: RequestHandler = async () => {
    try {
        const services = getServices();
        const boards = services.boards.listBoards();
        return json({ boards });
    } catch (err) {
        return handleError(err);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        const board = services.boards.createBoard({ name: body.name, description: body.description });
        return json({ board }, { status: 201 });
    } catch (err) {
        return handleError(err);
    }
};
