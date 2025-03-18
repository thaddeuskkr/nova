import { readdir } from 'fs/promises';
import mongoose from 'mongoose';
import { join } from 'path';
import pino from 'pino';
import { Link } from './models';
import type { Config, Route } from './types';

const databaseUrl = process.env['MONGODB_CONNECTION_URL'];
const port = Number(process.env.PORT || 3000);
const level = process.env.LOG_LEVEL || 'info';
const development = process.env.DEVELOPMENT === 'true';
const apiAuth =
    process.env.API_AUTH?.split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0 && key.toLowerCase() !== 'false') || [];
const randomSlugLength = Number(process.env.RANDOM_SLUG_LENGTH || 6);
const baseUrlRedirect = process.env.BASE_URL_REDIRECT || '';
const prohibitedSlugs = process.env.PROHIBITED_SLUGS?.split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0) || ['api'];
const prohibitedCharacters = process.env['PROHIBITED_CHARACTERS_IN_SLUGS'] || '/';
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

const packageJson = await Bun.file(join(import.meta.dir, '..', 'package.json')).json();
const version = packageJson.version;

$.info(`Starting Nova v${version}`);

const config: Config = {
    apiAuth,
    randomSlugLength,
    baseUrlRedirect,
    prohibitedSlugs,
    prohibitedCharacters: [...prohibitedCharacters],
};

const routes = new Map<string, Route>();
const files = await getAllFiles(join(import.meta.dir, 'routes'));
for (const file of files) {
    const module = await import(file);
    try {
        routes.set(module.route.url, module.route);
        $.debug(`Successfully loaded: ${module.route.url}`);
    } catch (error) {
        $.warn(`Failed to load: ${file}`);
        $.debug(error);
    }
}

export const templates = {
    index: await Bun.file(join(import.meta.dir, 'templates', 'index.html')).text(),
    shorten: await Bun.file(join(import.meta.dir, 'templates', 'shorten.html')).text(),
    401: await Bun.file(join(import.meta.dir, 'templates', '401.html')).text(),
    404: await Bun.file(join(import.meta.dir, 'templates', '404.html')).text(),
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

Bun.serve({
    port,
    development,
    fetch: async (request, server) => {
        const url = new URL(request.url);
        const ip = toIPv4(request.headers.get('x-forwarded-for') || server.requestIP(request)?.address || 'unknown');
        if (/\/public\//.test(url.pathname)) return routes.get('public')!.request({ $, server, request, url, version, ip, config });
        const route = routes.get(url.pathname);
        $.debug(`${request.method} ${url.pathname} | ${ip}`);
        return route ?
                route.request({ $, server, request, url, version, ip, config })
            :   routes.get('$')!.request({ $, server, request, url, version, ip, config }); // '$' is the route that handles all slugs, it should always be defined.
    },
});

$.info(`Server started on port ${port}`);

function toIPv4(ip: string): string {
    const prefix = '::ffff:';
    if (ip.startsWith(prefix)) return ip.slice(prefix.length);
    return ip;
}

async function getAllFiles(dirPath: string): Promise<string[]> {
    const dirents = await readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];
    for (const dirent of dirents) {
        const fullPath = join(dirPath, dirent.name);
        if (dirent.isDirectory()) files.push(...(await getAllFiles(fullPath)));
        else if (dirent.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.js'))) files.push(fullPath);
    }
    return files;
}

function isValidUrl(string: string): boolean {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }
    return true;
}

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
