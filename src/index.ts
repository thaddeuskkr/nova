import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import mongoose from 'mongoose';
import { join } from 'path';
import pino from 'pino';
import { Link } from './models';
import type { Config } from './types';
import { getIP, isValidUrl } from './utils';

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

const config: Config = {
    apiAuth,
    randomSlugLength,
    baseUrlRedirect,
    prohibitedSlugs,
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

import * as routes from './routes';
app.use(routes.main({ $, version, config }));
app.use(routes.slugs({ $, version, config }));
app.use(routes.api.shorten({ $, version, config }));

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
