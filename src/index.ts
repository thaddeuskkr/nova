import { readdir } from 'fs/promises';
import mongoose from 'mongoose';
import { join } from 'path';
import pino from 'pino';
import type { Config, Route } from './types';

const databaseUrl = process.env['MONGODB_CONNECTION_URL'];
const port = Number(process.env.PORT || 3000);
const level = process.env.LOG_LEVEL || 'info';
const development = process.env.DEVELOPMENT === 'true';
const apiAuth = process.env.API_AUTH || '';
const randomSlugLength = Number(process.env.RANDOM_SLUG_LENGTH || 6);
const baseUrlRedirect = process.env.BASE_URL_REDIRECT || '';
const prohibitedSlugs = process.env.PROHIBITED_SLUGS?.split(',').filter((element) => element.length > 0) || ['api'];
const prohibitedCharacters = process.env['PROHIBITED_CHARACTERS_IN_SLUGS'] || '/';
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
if (baseUrlRedirect.length > 0 && !isValidHttpUrl(baseUrlRedirect) && baseUrlRedirect.toLowerCase() !== 'false') {
    console.error('Environment variable BASE_URL_REDIRECT must be a valid URL, exiting');
    process.exit(1);
}

const $ = pino({ level });

const packageJson = await Bun.file(join(import.meta.dir, '..', 'package.json')).json();
const version = packageJson.version;

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

export const _ = {
    css: await Bun.file(join(import.meta.dir, 'public', 'output.css')).text(),
    favicon: await Bun.file(join(import.meta.dir, 'public', 'favicon.ico')).arrayBuffer(),
    index: await Bun.file(join(import.meta.dir, 'public', 'html', 'index.html')).text(),
    shorten: await Bun.file(join(import.meta.dir, 'public', 'html', 'shorten.html')).text(),
    401: await Bun.file(join(import.meta.dir, 'public', 'html', '401.html')).text(),
    404: await Bun.file(join(import.meta.dir, 'public', 'html', '404.html')).text(),
};

try {
    await mongoose.connect(databaseUrl, {
        dbName: 'nova',
    });
    $.debug(`Connected to database at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
} catch (error) {
    $.fatal('Failed to connect to database');
    $.fatal(error);
    process.exit(1);
}

Bun.serve({
    port,
    development,
    fetch: async (request, server) => {
        const url = new URL(request.url);
        const route = routes.get(url.pathname);
        const ip = toIPv4(request.headers.get('x-forwarded-for') || server.requestIP(request)?.address || 'unknown');
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

function isValidHttpUrl(string: string): boolean {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
}
