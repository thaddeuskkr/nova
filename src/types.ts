import type { Server } from 'bun';
import type { Logger } from 'pino';

export type Route = {
    url: string;
    request: ({
        $,
        request,
        server,
        url,
        version,
        ip,
        config,
    }: {
        $: Logger;
        request: Request;
        server: Server;
        url: URL;
        version: string;
        ip: string;
        config: Config;
    }) => Response | Promise<Response>;
};

export type Config = {
    apiAuth: string[];
    randomSlugLength: number;
    baseUrlRedirect: string;
    prohibitedSlugs: string[];
    prohibitedCharacters: string[];
};
