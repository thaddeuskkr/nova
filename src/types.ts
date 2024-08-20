import type { FastifyInstance, DoneFuncWithErrOrRes } from 'fastify';
import type { Logger } from 'pino';

export type Route = (fastify: FastifyInstance, { $, config }: { $: Logger; config: ConfigObject }, done: DoneFuncWithErrOrRes) => void;
export type ConfigObject = {
    baseUrl: string;
    prohibitedSlugs: string[];
    prohibitedCharacters: string[];
};
