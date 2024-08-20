import { Link } from '../models';
import type { Route } from '../types';

export const routes: Route = (fastify, _, done) => {
    fastify.route({
        method: ['GET'],
        url: '*',
        handler: async (request, reply) => {
            const link = await Link.findOne({ slugs: request.url.replace(/\//, '') });
            if (!link) return reply.code(404).send({ error: true, message: 'Not found' });
            reply.code(301).redirect(link.url);
        },
    });
    done();
};
