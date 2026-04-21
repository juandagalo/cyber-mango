import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (body.position === undefined || body.position === null) {
            return json({ error: 'position is required' }, { status: 400 });
        }
        if (typeof body.position !== 'number') {
            return json({ error: 'position must be a number' }, { status: 400 });
        }
        const column = services.columns.reorder(params.id as string, body.position);
        return json({ column });
    } catch (err) {
        return handleError(err);
    }
};
