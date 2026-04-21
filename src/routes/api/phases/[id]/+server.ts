import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const PATCH: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (body.name === undefined && body.color === undefined) {
            return json({ error: 'at least one of name, color is required' }, { status: 400 });
        }
        if (body.name !== undefined && typeof body.name !== 'string') {
            return json({ error: 'name must be a string' }, { status: 400 });
        }
        if (body.color !== undefined && typeof body.color !== 'string') {
            return json({ error: 'color must be a string' }, { status: 400 });
        }
        const phase = services.phases.update(params.id as string, {
            name: body.name,
            color: body.color
        });
        return json({ phase });
    } catch (err) {
        return handleError(err);
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        services.phases.delete(params.id as string);
        return new Response(null, { status: 204 });
    } catch (err) {
        return handleError(err);
    }
};
