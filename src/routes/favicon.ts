import { _ } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: '/favicon.ico',
    async request() {
        const body = _['favicon'];
        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': 'image/x-icon',
            },
        });
    },
};
