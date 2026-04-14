import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        const column = services.columns.create({
            boardId: body.boardId,
            name: body.name,
            color: body.color,
            wipLimit: body.wipLimit
        });
        return json({ column }, { status: 201 });
    } catch (err) {
        return handleError(err);
    }
};
