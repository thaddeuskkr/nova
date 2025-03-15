import { _ } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: '/',
    async request({ $, version, url, ip, config }) {
        if (config.baseUrlRedirect.length && config.baseUrlRedirect.toLowerCase() !== 'false') {
            $.debug(`307 ${url.pathname} | ${ip}`);
            return Response.redirect(config.baseUrlRedirect, 307);
        }
        let body = _['index']
            .replace(/{{version}}/g, version)
            .replace(/{{url}}/g, url.pathname)
            .replace(/{{ip}}/g, ip);
        const [apiAuth] = url.searchParams.keys();
        if (!config.apiAuth.length || (apiAuth && config.apiAuth.includes(apiAuth)))
            body = _['shorten']
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
