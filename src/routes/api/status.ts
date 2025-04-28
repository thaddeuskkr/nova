import { Elysia } from 'elysia';
import { Link } from '../../models';
import type { Route } from '../../types';
import { getIP } from '../../utils';

export const url: string = '/api/status';
export const route: Route = ({ config }) =>
    new Elysia().post(url, async ({ request, server, set }) => {
        const ip = getIP(request, server);
        set.headers['content-type'] = 'application/json';
        const links = await Link.find();
        const slugs = links.map((link) => link.slugs).flat();
        return {
            version: process.env.NOVA_VERSION ? `v${process.env.NOVA_VERSION}` : '[development]',
            apiAuth: config.apiAuth.length > 0,
            uptime: Bun.nanoseconds(),
            ip: ip,
            urls: links.length,
            slugs: slugs.length,
        };
    });
