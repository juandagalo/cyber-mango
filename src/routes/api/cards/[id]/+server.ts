import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        const card = services.cards.getById(params.id as string);
        return json({ card });
    } catch (err) {
        return handleError(err);
    }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        const card = services.cards.update(params.id as string, {
            title: body.title,
            description: body.description,
            priority: body.priority
        });
        return json({ card });
    } catch (err) {
        return handleError(err);
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        services.cards.delete(params.id as string);
        return new Response(null, { status: 204 });
    } catch (err) {
        return handleError(err);
    }
};
