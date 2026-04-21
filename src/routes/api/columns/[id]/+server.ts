import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const PATCH: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (body.name === undefined && body.color === undefined && body.wipLimit === undefined) {
            return json({ error: 'at least one of name, color, wipLimit is required' }, { status: 400 });
        }
        if (body.name !== undefined && typeof body.name !== 'string') {
            return json({ error: 'name must be a string' }, { status: 400 });
        }
        if (body.color !== undefined && typeof body.color !== 'string') {
            return json({ error: 'color must be a string' }, { status: 400 });
        }
        if (body.wipLimit !== undefined && body.wipLimit !== null && typeof body.wipLimit !== 'number') {
            return json({ error: 'wipLimit must be a number or null' }, { status: 400 });
        }
        const column = services.columns.update(params.id as string, {
            name: body.name,
            color: body.color,
            wipLimit: body.wipLimit
        });
        return json({ column });
    } catch (err) {
        return handleError(err);
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        services.columns.delete(params.id as string);
        return new Response(null, { status: 204 });
    } catch (err) {
        return handleError(err);
    }
};
