import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';

export const POST: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        services.tags.assignToCard(params.id as string, params.tagId as string);
        return new Response(null, { status: 204 });
    } catch (err) {
        return handleError(err);
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const services = getServices();
        services.tags.removeFromCard(params.id as string, params.tagId as string);
        return new Response(null, { status: 204 });
    } catch (err) {
        return handleError(err);
    }
};
