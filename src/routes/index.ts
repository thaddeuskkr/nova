import type { Route } from '../types.js';

export const routes: Route = (fastify, { config }, done) => {
    fastify.route({
        method: ['GET'],
        url: '/',
        handler: async (request, reply) => {
            if (config.baseUrlRedirect.length > 0) {
                reply.code(307).redirect(config.baseUrlRedirect);
                return;
            }
            reply.code(200).send(`${config.info.name} v${config.info.version} by ${config.info.author}` +
                '\n' +
                'https://github.com/thaddeuskkr/nova' +
                '\n\n' +
                `Your IP address is ${request.headers['x-forwarded-for'] || request.ip}`);
        },
    });
    done();
};
