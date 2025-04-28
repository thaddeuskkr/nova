import type { Elysia } from 'elysia';
import type { Logger } from 'pino';

export type Route = ({ $, version, config }: { $: Logger; version: string; config: Config }) => Elysia;

export type Config = {
    apiAuth: string[];
    randomSlugLength: number;
    baseUrlRedirect: string;
    prohibitedSlugs: string[];
    googleOIDC: {
        clientId: string | undefined;
        clientSecret: string | undefined;
        redirectUri: string | undefined;
        allowedUsers: string[];
    };
};

export type GoogleUser = {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
};
