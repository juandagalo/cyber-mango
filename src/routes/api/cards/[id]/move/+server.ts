import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (!body.columnId || typeof body.columnId !== 'string') {
            return json({ error: 'columnId is required and must be a string' }, { status: 400 });
        }
        if (body.position === undefined || body.position === null) {
            return json({ error: 'position is required' }, { status: 400 });
        }
        if (typeof body.position !== 'number') {
            return json({ error: 'position must be a number' }, { status: 400 });
        }
        const card = services.cards.move(params.id as string, {
            columnId: body.columnId,
            position: body.position
        });
        return json({ card });
    } catch (err) {
        return handleError(err);
    }
};
