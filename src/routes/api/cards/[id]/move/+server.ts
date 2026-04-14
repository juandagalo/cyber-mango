import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        const card = services.cards.move(params.id as string, {
            columnId: body.columnId,
            position: body.position
        });
        return json({ card });
    } catch (err) {
        return handleError(err);
    }
};
