import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        const card = services.cards.create({
            columnId: body.columnId,
            title: body.title,
            description: body.description,
            priority: body.priority
        });
        return json({ card }, { status: 201 });
    } catch (err) {
        return handleError(err);
    }
};
