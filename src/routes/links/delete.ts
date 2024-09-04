import { Link, User } from '../../models.js';
import type { Route } from '../../types.js';

export const routes: Route = (fastify, { $, config }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/links/delete',
        handler: async (request, reply) => {
            if (typeof request.headers.authorization !== 'string') {
                reply.code(400).send({ error: true, message: 'This route requires the Authorization header to be set to a user token' });
                return;
            }
            const token = request.headers.authorization as string;
            const user = await User.findOne({ token });
            if (!user) {
                reply.code(401).send({ error: true, message: 'Invalid user token' });
                return;
            }
            if (!config.urlDeletionEnabled) {
                reply.code(403).send({ error: true, message: 'Deletion of shortened URLs is disabled on this instance' });
                return;
            }
            const body = request.body as { slugs?: string } | undefined;
            if (!body) {
                reply.code(400).send({ error: true, message: 'Missing request body' });
                return;
            }
            if (!body.slugs) {
                reply.code(400).send({ error: true, message: 'Missing required fields' });
                return;
            }
            const slugs = body.slugs.split(',').map((slug) => slug.trim().toLowerCase()) || [];
            const link = await Link.findOne({ slugs: { $in: slugs } });
            if (!link) {
                reply.code(400).send({ error: true, message: 'Short URL does not exist' });
                return;
            }
            if (!link.user.equals(user._id) && !user.admin) {
                reply.code(401).send({ error: true, message: 'You do not have permission to delete this short URL' });
                return;
            }
            await Link.findByIdAndDelete(link._id);
            reply.code(200).send({
                error: false,
                message: 'Deleted short URL successfully',
                url: link.url,
                slugs: link.slugs,
            });
            $.debug(`Deleted ${link.url} (${link.slugs.join(', ')})`);
        },
    });
    done();
};
