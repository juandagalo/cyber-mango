import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getServices } from '$lib/server/services.js';
import { handleError } from '$lib/utils/api.js';
import { ValidationError } from '$lib/server/errors.js';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const services = getServices();
        const boardId = url.searchParams.get('boardId');
        if (!boardId) {
            throw new ValidationError('boardId query parameter is required');
        }
        const tags = services.tags.listByBoard(boardId);
        return json({ tags });
    } catch (err) {
        return handleError(err);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const services = getServices();
        const body = await request.json();
        const tag = services.tags.create({
            boardId: body.boardId,
            name: body.name,
            color: body.color
        });
        return json({ tag }, { status: 201 });
    } catch (err) {
        return handleError(err);
    }
};
