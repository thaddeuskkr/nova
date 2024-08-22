import { Link, User } from '../../models.js';
import type { Route } from '../../types.js';
import { generatePassword } from '../../utils.js';

export const routes: Route = (fastify, { $, config }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/links/create',
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
            const body = request.body as { url?: string; slugs?: string; description?: string; public?: string; password?: string } | undefined;
            if (!body) {
                reply.code(400).send({ error: true, message: 'Missing request body' });
                return;
            }
            if (!body.slugs || !body.url) {
                reply.code(400).send({ error: true, message: 'Missing required fields' });
                return;
            }
            const isPublic = body.public ? body.public === 'true' : true;
            const password = isPublic ? null : body.password || generatePassword(16, ['numbers', 'lowercase', 'uppercase']);
            const slugs = body.slugs
                .split(',')
                .map((slug) => slug.trim())
                .filter((slug) => slug.length > 0);
            const prohibitedSlugs = slugs.filter((slug) => config.prohibitedSlugs.includes(slug));
            const slugsWithProhibitedCharacters = slugs.filter((slug) => config.prohibitedCharacters.some((char) => slug.includes(char)));
            if (prohibitedSlugs.length > 0) {
                reply.code(400).send({ error: true, message: `Prohibited slugs: ${prohibitedSlugs.join(', ')}` });
                return;
            }
            if (slugsWithProhibitedCharacters.length > 0) {
                reply.code(400).send({ error: true, message: `Slugs contain prohibited characters: ${slugsWithProhibitedCharacters.join(', ')}` });
                return;
            }
            if (await Link.findOne({ slugs: { $in: slugs } })) {
                reply.code(400).send({ error: true, message: 'Shortened URL in use' });
                return;
            }
            const link = new Link({
                url: body.url,
                slugs: slugs,
                description: body.description || null,
                public: isPublic,
                password,
                user: user._id,
            });
            await link.save();
            reply.code(200).send({
                error: false,
                message: 'Shortened URL successfully',
                shortUrl: `${config.baseUrl}/${link.slugs[0]}${link.password ? `?pw=${link.password}` : ''}`,
                longUrl: link.url,
                slugs: link.slugs,
                description: link.description,
                public: link.public,
                password: link.password,
            });
            $.debug(`Shortened ${link.url} (${link.slugs.join(', ')})`);
        },
    });
    done();
};
