import type { DoneFuncWithErrOrRes, FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

export type Route = (fastify: FastifyInstance, { $, config }: { $: Logger; config: Config }, done: DoneFuncWithErrOrRes) => void;
export type Config = {
    info: {
        name: string;
        author: string;
        version: string;
    };
    baseUrl: string;
    baseUrlRedirect: string;
    prohibitedSlugs: string[];
    prohibitedCharacters: string[];
    baseDirectory: string;
};
