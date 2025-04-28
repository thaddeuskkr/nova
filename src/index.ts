import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { randomBytes } from 'crypto';
import { Elysia, t } from 'elysia';
import { oauth2 } from 'elysia-oauth2';
import mongoose from 'mongoose';
import { join } from 'path';
import pino from 'pino';
import { Link, User } from './models';
import type { Config, GoogleUser } from './types';
import { getIP, isValidUrl, oidcUserAllowed } from './utils';

const databaseUrl = process.env.MONGODB_CONNECTION_URL;
const port = Number(process.env.PORT || 3000);
const level = process.env.LOG_LEVEL || 'info';
const apiAuth =
    process.env.API_AUTH?.split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0 && key.toLowerCase() !== 'false') || [];
const randomSlugLength = Number(process.env.RANDOM_SLUG_LENGTH || 6);
const baseUrlRedirect = process.env.BASE_URL_REDIRECT || '';
const prohibitedSlugs = process.env.PROHIBITED_SLUGS?.split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0) || ['api'];
const expiredLinkScanInterval = Number(process.env.EXPIRED_LINK_SCAN_INTERVAL || 15) * 1000;
const googleOIDC = {
    clientId: process.env.GOOGLE_OAUTH2_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_OAUTH2_REDIRECT_URI,
    allowedUsers:
        process.env.GOOGLE_OAUTH2_ALLOWED_USERS?.split(',')
            .map((key) => key.trim())
            .filter((key) => key.length > 0 && key.toLowerCase() !== 'false') || [],
};
if (!databaseUrl) {
    console.error('Environment variable MONGODB_CONNECTION_URL not set, exiting');
    process.exit(1);
}
if (isNaN(port) || port < 1 || port > 65535) {
    console.error('Environment variable PORT must be a number between 1 and 65535, exiting');
    process.exit(1);
}
if (['debug', 'error', 'fatal', 'info', 'silent', 'trace', 'warn'].indexOf(level) === -1) {
    console.error('Environment variable LOG_LEVEL must be one of [debug, error, fatal, info, silent, trace, warn], exiting');
    process.exit(1);
}
if (randomSlugLength < 4) {
    console.error('Environment variable RANDOM_SLUG_LENGTH must be a number greater than or equal to 4, exiting');
    process.exit(1);
}
if (baseUrlRedirect.length > 0 && !isValidUrl(baseUrlRedirect) && baseUrlRedirect.toLowerCase() !== 'false') {
    console.error('Environment variable BASE_URL_REDIRECT must be a valid URL, exiting');
    process.exit(1);
}

const $ = pino({ level });

const version = process.env.NOVA_VERSION ? `v${process.env.NOVA_VERSION}` : '[development]';

$.info(`Starting Nova ${version}`);

export const config: Config = {
    apiAuth,
    randomSlugLength,
    baseUrlRedirect,
    prohibitedSlugs,
    googleOIDC,
};

try {
    await mongoose.connect(databaseUrl, {
        dbName: 'nova',
    });
    $.debug(`Connected to database at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    scanForExpiredLinks();
} catch (error) {
    $.fatal('Failed to connect to database');
    $.fatal(error);
    process.exit(1);
}

setInterval(scanForExpiredLinks, expiredLinkScanInterval);

const app = new Elysia()
    .onRequest(({ request, server }) => {
        $.debug(`${request.method} ${new URL(request.url).pathname} | ${getIP(request, server)}`);
    })
    .use(staticPlugin({ assets: join(import.meta.dir, '..', 'public') }))
    .use(html({ autoDetect: false, autoDoctype: false }));
if (googleOIDC.clientId && googleOIDC.clientSecret && googleOIDC.redirectUri) {
    app.use(
        oauth2({
            Google: [googleOIDC.clientId, googleOIDC.clientSecret, googleOIDC.redirectUri],
        }),
    )
        .get('/api/auth/google', async ({ oauth2, redirect }) => {
            const url = oauth2.createURL('Google', ['openid', 'email', 'profile']);
            url.searchParams.set('access_type', 'offline');
            return redirect(url.href);
        })
        .get(
            '/api/auth/google/callback',
            async ({ oauth2, cookie: { token }, set, path, request, server, redirect }) => {
                const tokens = await oauth2.authorize('Google');
                const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
                });
                const profile = (await res.json()) as GoogleUser | undefined;
                if (!profile) {
                    set.status = 400;
                    $.debug(`400 ${path} | ${getIP(request, server)}`);
                    return { error: 'Failed to fetch user profile' };
                }
                if (!oidcUserAllowed(profile)) {
                    set.status = 401;
                    $.debug(`401 ${path} | ${getIP(request, server)}`);
                    return { error: 'Unauthorized' };
                }
                const existingUser = await User.findOne({ sub: profile.sub });
                token.value = existingUser?.token || randomBytes(64).toBase64();
                token.expires = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);
                await User.updateOne({ sub: profile.sub }, { ...profile, token: token.value }, { upsert: true });
                $.debug(`User ${profile.email} (${profile.sub}) logged in`);
                return redirect('/');
            },
            {
                cookie: t.Cookie({
                    token: t.Optional(t.String()),
                }),
            },
        );
}

import * as routes from './routes';
app.use(routes.main({ $, version, config }));
app.use(routes.slugs({ $, version, config }));
app.use(routes.api.shorten({ $, version, config }));
app.use(routes.api.status({ $, version, config }));

app.listen(port);

$.info(`Server started on port ${port}`);

function scanForExpiredLinks(): void {
    const now = new Date();
    Link.deleteMany({ expiry: { $lt: now } })
        .then((result) => {
            if (result.deletedCount > 0) $.debug(`Deleted ${result.deletedCount} expired links`);
        })
        .catch((error) => {
            $.error('An error occurred while deleting expired links');
            $.error(error);
        });
}
