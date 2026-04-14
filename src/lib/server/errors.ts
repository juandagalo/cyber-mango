export class AppError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number = 500
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(entity: string, id: string) {
        super('NOT_FOUND', `${entity} '${id}' not found`, 404);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super('VALIDATION_ERROR', message, 400);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super('CONFLICT', message, 409);
    }
}
