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
        if (body.title === undefined && body.description === undefined && body.priority === undefined && body.phaseId === undefined) {
            return json({ error: 'at least one field is required: title, description, priority, phaseId' }, { status: 400 });
        }
        if (body.title !== undefined && typeof body.title !== 'string') {
            return json({ error: 'title must be a string' }, { status: 400 });
        }
        const card = services.cards.update(params.id as string, {
            title: body.title,
            description: body.description,
            priority: body.priority,
            phaseId: body.phaseId
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
