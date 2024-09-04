import FastifyFormBody from '@fastify/formbody';
import 'dotenv/config';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pino } from 'pino';
import type { ConfigObject } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env['MONGODB_CONNECTION_URL'];
const host = process.env['HOST'] || 'localhost';
const port = process.env['PORT'] || '3000';
const level = process.env['LOG_LEVEL'] || 'info';
const baseUrl = process.env['BASE_URL'] || `http://${host}:${port}`;
const baseUrlRedirect = process.env['BASE_URL_REDIRECT'] || '';
const allowedHosts = process.env['ALLOWED_HOSTS']?.split(',').filter((element) => element.length > 0) || [];
const prohibitedSlugs = process.env['PROHIBITED_SLUGS']?.split(',').filter((element) => element.length > 0) || ['api'];
const prohibitedCharacters = process.env['PROHIBITED_CHARACTERS_IN_SLUGS'] || '/';
const registrationEnabled = process.env['REGISTRATION_ENABLED'] ? process.env['REGISTRATION_ENABLED'] == 'true' : true;
const urlDeletionEnabled = process.env['URL_DELETION_ENABLED'] ? process.env['URL_DELETION_ENABLED'] == 'true' : true;

const $ = pino({ level });
const fastify = Fastify({ logger: false });

if (!databaseUrl) {
    $.fatal('Environment variable MONGODB_CONNECTION_URL not set, exiting');
    process.exit(1);
}

const require = createRequire(import.meta.url);
const name = (require('../package.json').name as string).charAt(0).toUpperCase() + (require('../package.json').name as string).slice(1);
const author = require('../package.json').author as string;
const version = require('../package.json').version as string;

$.info(`${name} v${version} by ${author}`);
$.info(`Node.js ${process.version} • Fastify v${fastify.version} • Mongoose v${mongoose.version}`);

let ready = false;

fastify.register(FastifyFormBody);
fastify.addHook('onRequest', (request, reply, done) => {
    if (allowedHosts.length > 0 && !allowedHosts.includes(request.hostname)) {
        reply.code(403).send(`${request.hostname} is not in the list of allowed hosts.` +
        '\n\n' +
        `${name} v${version} by ${author}` +
        '\n' +
        'https://github.com/thaddeuskkr/nova');
        $.debug(`-> [${request.hostname}] Rejected ${request.method} ${request.url} from ${request.headers['x-forwarded-for'] || request.ip}`);
        return;
    }
    $.debug(`-> [${request.hostname}] ${request.method} ${request.url} from ${request.headers['x-forwarded-for'] || request.ip}`);
    if (ready == false) {
        reply.code(503).send('Server is not ready for requests.' +
        '\n\n' +
        `${name} v${version} by ${author}` +
        '\n' +
        'https://github.com/thaddeuskkr/nova');
        return;
    }
    done();
});

try {
    await mongoose.connect(databaseUrl, {});
    $.debug(`Connected to database at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
} catch (error) {
    $.fatal(error);
    process.exit(1);
}

for (const route of readFiles(path.join(__dirname, 'routes'))) {
    try {
        const imported = await import(route);
        await fastify.register(imported.routes, {
            $,
            config: {
                info: { name, author, version },
                baseUrl,
                baseUrlRedirect,
                prohibitedSlugs,
                prohibitedCharacters: [...prohibitedCharacters],
                baseDirectory: __dirname,
                registrationEnabled,
                urlDeletionEnabled,
            } as ConfigObject,
        });
        $.debug(`Registered ${route}`);
    } catch (error) {
        $.warn(`Failed to register ${route}`);
        if (error instanceof Error && error.message) $.warn(error.message);
    }
}

try {
    await fastify.listen({ host, port: Number(port) });
    $.debug(`Server listening at ${host}:${port}`);
} catch (error) {
    $.fatal(error);
    process.exit(1);
}

ready = true;
$.info('Ready!');

for (const event of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
    process.on(event, () => {
        $.warn(`Received ${event}, exiting`);
        process.exit(0);
    });
}

for (const event of ['unhandledRejection', 'uncaughtException']) {
    process.on(event, (error) => {
        $.fatal(error);
        process.exit(1);
    });
}

function readFiles(directory: string): string[] {
    let files: string[] = [];
    for (const item of fs.readdirSync(directory)) {
        const fullPath = path.join(directory, item);
        if (fs.statSync(fullPath).isDirectory()) files = [...files, ...readFiles(fullPath)];
        else files.push(fullPath);
    }
    return files;
}
