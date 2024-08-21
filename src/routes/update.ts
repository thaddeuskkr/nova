import { Link, User } from '../models.js';
import type { Route } from '../types.js';
import { generatePassword } from '../utils.js';

export const routes: Route = (fastify, { $, config }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/update',
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
            const body = request.body as { slug?: string; url?: string; slugs?: string; description?: string; public?: string; password?: string } | undefined;
            if (!body) {
                reply.code(400).send({ error: true, message: 'Missing request body' });
                return;
            }
            if (!body.slug) {
                reply.code(400).send({ error: true, message: 'Missing required fields' });
                return;
            }
            const slugs = body.slug.split(',').map((slug) => slug.trim()) || [];
            const link = await Link.findOne({ slugs: { $in: slugs } });
            if (!link) {
                reply.code(400).send({ error: true, message: 'Short URL does not exist' });
                return;
            }
            if (!link.user.equals(user._id) && !user.admin) {
                reply.code(401).send({ error: true, message: 'You do not have permission to edit this short URL' });
                return;
            }
            const updatedSlugs = body.slugs?.split(',').map((slug) => slug.trim()).filter((slug) => slug.length > 0);
            if (await Link.findOne({ slugs: { $in: updatedSlugs?.filter((s) => !link.slugs.includes(s)) } })) {
                reply.code(400).send({ error: true, message: 'Shortened URL in use' });
                return;
            }
            const isPublic = body.public ? body.public === 'true' : true;
            const password = isPublic ? null : body.password || link.password || generatePassword(16, ['numbers', 'lowercase', 'uppercase']);
            const updatedShort = await Link.findByIdAndUpdate(link._id, {
                url: body.url || link.url,
                slugs: body.slugs ? updatedSlugs : link.slugs,
                description: body.description === 'null' ? null : (body.description || link.description || null),
                public: isPublic,
                password,
            }, { new: true });
            if (!updatedShort) {
                reply.code(400).send({ error: true, message: 'Short URL does not exist' });
                return;
            }
            reply.code(200).send({
                error: false,
                message: 'Updated short URL successfully',
                shortUrl: `${config.baseUrl}/${updatedShort.slugs[0]}${updatedShort.password ? `?pw=${updatedShort.password}` : ''}`,
                longUrl: updatedShort.url,
                slugs: updatedShort.slugs,
                description: updatedShort.description,
                public: updatedShort.public,
                password: updatedShort.password,
            });
            $.debug(`${user.username} (${user.email}) updated ${updatedShort.url} (${updatedShort.slugs.join(', ')})`);
        },
    });
    done();
};
