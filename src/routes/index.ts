import { templates } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: '/',
    async request({ $, version, url, ip, config }) {
        if (config.baseUrlRedirect.length && config.baseUrlRedirect.toLowerCase() !== 'false') {
            $.debug(`307 ${url.pathname} | ${ip}`);
            return Response.redirect(config.baseUrlRedirect, 307);
        }
        let body = templates['index'];
        const [apiAuth] = url.searchParams.keys();
        if (!config.apiAuth.length || (apiAuth && config.apiAuth.includes(apiAuth))) body = templates['shorten'];
        return new Response(
            body
                .replace(/{{version}}/g, version)
                .replace(/{{url}}/g, url.pathname)
                .replace(/{{ip}}/g, ip),
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/html',
                },
            },
        );
    },
};
