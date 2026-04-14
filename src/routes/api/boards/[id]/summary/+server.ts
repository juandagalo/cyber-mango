import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        const summary = services.boards.getBoardSummary(params.id as string);
        return json({ summary });
    } catch (err) {
        return handleError(err);
    }
};
