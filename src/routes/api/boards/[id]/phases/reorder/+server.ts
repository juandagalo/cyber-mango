import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (!Array.isArray(body.orderedIds)) {
            return json({ error: 'orderedIds is required and must be an array' }, { status: 400 });
        }
        const phases = services.phases.reorder(params.id as string, body.orderedIds);
        return json({ phases });
    } catch (err) {
        return handleError(err);
    }
};
