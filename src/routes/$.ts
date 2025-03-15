import { _ } from '../index';
import { Link } from '../models';
import type { Route } from '../types';

export const route: Route = {
    url: '$',
    async request({ $, version, url, ip }) {
        const link = await Link.findOne({ slugs: url.pathname.slice(1) });
        if (!link) {
            $.debug(`404 ${url.pathname} | ${ip}`);
            return new Response(
                _[404]
                    .replace(/{{version}}/g, version)
                    .replace(/{{url}}/g, url.pathname)
                    .replace(/{{ip}}/g, ip),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'text/html',
                    },
                },
            );
        }
        if (link.password) {
            const [userPassword] = url.searchParams.keys();
            if (!userPassword) {
                $.debug(`401 ${url.pathname} | ${ip}`);
                return new Response(
                    _[401]
                        .replace(/{{version}}/g, version)
                        .replace(/{{url}}/g, url.pathname)
                        .replace(/{{ip}}/g, ip),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'text/html',
                        },
                    },
                );
            }
            const verified = await Bun.password.verify(userPassword, link.password);
            if (!verified) {
                $.debug(`401 ${url.pathname} | ${ip}`);
                return new Response(
                    _[401]
                        .replace(/{{version}}/g, version)
                        .replace(/{{url}}/g, url.pathname)
                        .replace(/{{ip}}/g, ip),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'text/html',
                        },
                    },
                );
            }
        }
        link.clicks ? link.clicks++ : (link.clicks = 1);
        await link.save();
        $.debug(`307 ${url.pathname} | ${ip}`);
        return Response.redirect(link.url, 307);
    },
};
