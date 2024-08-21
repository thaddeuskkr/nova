import type { DoneFuncWithErrOrRes, FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

export type Route = (fastify: FastifyInstance, { $, config }: { $: Logger; config: Config }, done: DoneFuncWithErrOrRes) => void;
export type Config = {
    baseUrl: string;
    prohibitedSlugs: string[];
    prohibitedCharacters: string[];
};
