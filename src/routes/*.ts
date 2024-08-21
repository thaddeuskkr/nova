import { Link } from '../models.js';
import type { Route } from '../types.js';

export const routes: Route = (fastify, _, done) => {
    fastify.route({
        method: ['GET'],
        url: '*',
        handler: async (request, reply) => {
            const link = await Link.findOne({ slugs: request.url.split('?')[0]?.replace(/\//, '') });
            if (!link) {
                reply.code(404).send('Short URL does not exist');
                return;
            }
            if (link.public) reply.code(301).redirect(link.url);
            else {
                const query = request.query as { password?: string; pw?: string; pass?: string };
                if (!query || (!query.password && !query.pw && !query.pass)) {
                    reply.code(401).send('This URL is password protected and you did not provide one in query parameters');
                    return;
                }
                const password = query.password || query.pw || query.pass;
                if (password !== link.password) {
                    reply.code(401).send('Incorrect password');
                    return;
                }
                reply.code(301).redirect(link.url);
            }
        },
    });
    done();
};
