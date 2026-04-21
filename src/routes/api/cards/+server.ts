import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (!body.columnId || typeof body.columnId !== 'string') {
            return json({ error: 'columnId is required and must be a string' }, { status: 400 });
        }
        if (!body.title || typeof body.title !== 'string') {
            return json({ error: 'title is required and must be a string' }, { status: 400 });
        }
        const card = services.cards.create({
            columnId: body.columnId,
            title: body.title,
            description: body.description,
            priority: body.priority,
            phaseId: body.phaseId
        });
        return json({ card }, { status: 201 });
    } catch (err) {
        return handleError(err);
    }
};
