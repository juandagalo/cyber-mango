import { writable } from 'svelte/store';

interface Toast {
    id: string;
    message: string;
    type: 'error' | 'success' | 'info';
}

export const toasts = writable<Toast[]>([]);

export function addToast(message: string, type: Toast['type'] = 'error') {
    const id = Math.random().toString(36).slice(2);
    toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
        toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
}

export function removeToast(id: string) {
    toasts.update(t => t.filter(toast => toast.id !== id));
}
