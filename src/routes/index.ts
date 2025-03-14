import { _ } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: '/',
    async request({ $, request, version, url, ip, config }) {
        if (config.baseUrlRedirect.length && config.baseUrlRedirect.toLowerCase() !== 'false') {
            $.debug(`301 ${url.pathname} | ${ip}`);
            return Response.redirect(config.baseUrlRedirect, 301);
        }
        let body = _['index']
            .replace(/{{version}}/g, version)
            .replace(/{{url}}/g, url.pathname)
            .replace(/{{ip}}/g, ip);
        const auth =
            request.headers.get('Authorization') ||
            url.searchParams.get('auth') ||
            url.searchParams.get('password') ||
            url.searchParams.get('pass') ||
            url.searchParams.get('p');
        if (!config.apiAuth || !config.apiAuth.length || config.apiAuth.toLowerCase() === 'false' || (auth && config.apiAuth === auth))
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
