import FastifyFormBody from '@fastify/formbody';
import 'dotenv/config';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'path';
import { pino } from 'pino';
import { fileURLToPath } from 'url';
import type { ConfigObject } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env['MONGODB_CONNECTION_URL'];
const host = process.env['HOST'] || '0.0.0.0';
const port = process.env['PORT'] || '3000';
const level = process.env['LOG_LEVEL'] || 'info';
const baseUrl = process.env['BASE_URL'] || 'http://localhost:3000';
const prohibitedSlugs = process.env['PROHIBITED_SLUGS']?.split(',') || [];
const prohibitedCharacters = process.env['PROHIBITED_CHARACTERS_IN_SLUGS'] || '';

const $ = pino({ level });
const fastify = Fastify({ logger: false });

if (typeof databaseUrl !== 'string') {
    $.fatal('Environment variable MONGODB_CONNECTION_URL not set, exiting');
    process.exit(1);
}

fastify.register(FastifyFormBody);
fastify.addHook('onRequest', (request, _, done) => {
    $.debug(`-> ${request.method} ${request.url} from ${request.headers['X-Forwarded-For'] || request.ip}`);
    done();
});

(async () => {
    for (const route of readFiles(path.join(__dirname, 'routes'))) {
        try {
            fastify.register((await import(route)).routes, {
                $,
                config: {
                    baseUrl,
                    prohibitedSlugs,
                    prohibitedCharacters: prohibitedCharacters.split(''),
                } as ConfigObject,
            });
            $.debug(`Registered ${route}`);
        } catch (err) {
            $.warn(`Failed to register ${route}`);
            if (err instanceof Error && err.message) $.warn(err.message);
        }
    }

    try {
        await mongoose.connect(databaseUrl, {});
        $.info('Connected to MongoDB');
    } catch (err) {
        $.fatal('Failed to connect to MongoDB');
        $.fatal(err);
        process.exit();
    }

    try {
        await fastify.listen({ host, port: Number(port) });
        $.info(`Server listening at ${host}:${port}`);
    } catch (err) {
        $.fatal('Failed to start web server');
        $.fatal(err);
        process.exit();
    }
})();

function readFiles(dir: string): string[] {
    let files: string[] = [];
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) files = files.concat(readFiles(fullPath));
        else files.push(fullPath);
    }
    return files;
}
