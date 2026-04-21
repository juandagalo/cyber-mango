import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        const phases = services.phases.listByBoard(params.id as string);
        return json({ phases });
    } catch (err) {
        return handleError(err);
    }
};

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        if (!body.name || typeof body.name !== 'string') {
            return json({ error: 'name is required and must be a string' }, { status: 400 });
        }
        if (!body.color || typeof body.color !== 'string') {
            return json({ error: 'color is required and must be a string' }, { status: 400 });
        }
        const phase = services.phases.create({
            boardId: params.id as string,
            name: body.name,
            color: body.color
        });
        return json({ phase }, { status: 201 });
    } catch (err) {
        return handleError(err);
    }
};
