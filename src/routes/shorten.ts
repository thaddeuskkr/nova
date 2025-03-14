import { _ } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: '/shorten',
    async request({ version, url, ip }) {
        const body = _['shorten']
            .replace(/{{version}}/g, version)
            .replace(/{{url}}/g, url.pathname)
            .replace(/{{ip}}/g, ip);
        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });
    },
};
