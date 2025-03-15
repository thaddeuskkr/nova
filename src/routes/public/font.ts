import { _ } from '../../index';
import type { Route } from '../../types';

export const route: Route = {
    url: '/fonts/Geist-VariableFont_wght.ttf',
    async request() {
        const body = _['font'];
        return new Response(body, {
            headers: {
                'Content-Type': 'font/ttf',
            },
        });
    },
};
