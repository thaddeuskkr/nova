import fs from 'node:fs';
import path from 'node:path';
import type { Route } from '../types.js';

export const routes: Route = (fastify, { config }, done) => {
    fastify.route({
        method: ['GET'],
        url: '/favicon.ico',
        handler: async (_, reply) => {
            reply.code(200).type('image/x-icon').send(fs.readFileSync(path.join(config.baseDirectory, '..', 'assets', 'favicon.ico')));
        },
    });
    done();
};
