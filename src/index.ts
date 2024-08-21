import FastifyFormBody from '@fastify/formbody';
import 'dotenv/config';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'path';
import { pino } from 'pino';
import { fileURLToPath } from 'url';
import type { Config } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env['MONGODB_CONNECTION_URL'];
const host = process.env['HOST'] || 'localhost';
const port = process.env['PORT'] || '3000';
const level = process.env['LOG_LEVEL'] || 'info';
const baseUrl = process.env['BASE_URL'] || `http://${host}:${port}`;
const prohibitedSlugs = process.env['PROHIBITED_SLUGS']?.split(',') || ['api'];
const prohibitedCharacters = process.env['PROHIBITED_CHARACTERS_IN_SLUGS'] || '/';

const $ = pino({ level });
const fastify = Fastify({ logger: false });

let ready = false;

if (typeof databaseUrl !== 'string') {
    $.fatal('Environment variable MONGODB_CONNECTION_URL not set, exiting');
    process.exit(1);
}

fastify.register(FastifyFormBody);
fastify.addHook('onRequest', (request, reply, done) => {
    $.debug(`-> ${request.method} ${request.url} from ${request.headers['X-Forwarded-For'] || request.ip}`);
    if (ready == false) {
        reply.code(503).send({ error: true, message: 'Server not ready for requests' });
        return;
    }
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
                } as Config,
            });
            $.debug(`Registered ${route}`);
        } catch (err) {
            $.warn(`Failed to register ${route}`);
            if (err instanceof Error && err.message) $.warn(err.message);
        }
    }

    try {
        await mongoose.connect(databaseUrl, {});
        $.debug(`Connected to database at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    } catch (err) {
        $.fatal('Failed to connect to MongoDB');
        $.fatal(err);
        process.exit();
    }

    try {
        await fastify.listen({ host, port: Number(port) });
        $.debug(`Server listening at ${host}:${port}`);
    } catch (err) {
        $.fatal('Failed to start web server');
        $.fatal(err);
        process.exit();
    }

    ready = true;
    $.info('Ready!');
})();

for (const event of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
    process.on(event, async () => {
        $.warn(`Received ${event}, exiting`);
        await fastify.close();
        await mongoose.connection.close();
        process.exit(0);
    });
}

for (const event of ['unhandledRejection', 'uncaughtException']) {
    process.on(event, async (err) => {
        $.fatal(err);
        await fastify.close();
        await mongoose.connection.close();
        process.exit(1);
    });
}

function readFiles(dir: string): string[] {
    let files: string[] = [];
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) files = files.concat(readFiles(fullPath));
        else files.push(fullPath);
    }
    return files;
}
