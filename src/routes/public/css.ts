import { _ } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: '/css',
    async request() {
        const body = _['css'];
        return new Response(body, {
            headers: {
                'Content-Type': 'text/css',
            },
        });
    },
};
