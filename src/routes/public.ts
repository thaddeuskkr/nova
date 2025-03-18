import { join } from 'path';
import { templates } from '../index';
import type { Route } from '../types';

export const route: Route = {
    url: 'public',
    async request({ $, version, url, ip }) {
        const path = url.pathname;
        const file = Bun.file(join(import.meta.dir, '..', 'public', path.replace(/^\/public\//, '')));
        const fileExists = await file.exists();
        if (!fileExists) {
            $.debug(`404 ${url.pathname} | ${ip}`);
            return new Response(
                templates[404]
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
        $.debug(`200 ${url.pathname} | ${ip}`);
        return new Response(file);
    },
};
