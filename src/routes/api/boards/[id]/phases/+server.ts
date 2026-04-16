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
