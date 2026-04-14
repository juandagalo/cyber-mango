import { json } from '@sveltejs/kit';
import { AppError } from '$lib/server/errors.js';

export function handleError(err: unknown) {
    if (err instanceof AppError) {
        return json(
            { error: { code: err.code, message: err.message } },
            { status: err.status }
        );
    }
    console.error('Unexpected error:', err);
    return json(
        { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
        { status: 500 }
    );
}
