import type Elysia from 'elysia';
import type { Logger } from 'pino';

export type Route = ({ $, version, config }: { $: Logger; version: string; config: Config }) => Elysia;

export type Config = {
    apiAuth: string[];
    randomSlugLength: number;
    baseUrlRedirect: string;
    prohibitedSlugs: string[];
};
