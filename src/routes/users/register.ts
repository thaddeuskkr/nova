import bcrypt from 'bcrypt';
import { User } from '../../models.js';
import type { Route } from '../../types.js';

export const routes: Route = (fastify, { $, config }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/users/register',
        handler: async (request, reply) => {
            const body = request.body as {
                username?: string;
                email?: string;
                password?: string;
                icon?: string;
                discord?: string;
            } | undefined;
            if (!body) {
                reply.code(400).send({ error: true, message: 'Missing request body' });
                return;
            }
            if (!body.username || !body.email || !body.password) {
                reply.code(400).send({ error: true, message: 'Missing required fields' });
                return;
            }
            if (!config.registrationEnabled) {
                reply.code(403).send({ error: true, message: 'Registration is disabled on this instance' });
                return;
            }
            if (await User.exists({
                $or: [
                    { username: body.username.toLowerCase() },
                    { email: body.username.toLowerCase() },
                    { username: body.email.toLowerCase() },
                    { email: body.email.toLowerCase() },
                ],
            })) {
                reply.code(400).send({ error: true, message: 'Username or email already in use' });
                return;
            }
            const user = new User({
                username: body.username.toLowerCase(),
                email: body.email.toLowerCase(),
                password: bcrypt.hashSync(body.password, 10),
                icon: body.icon || null,
                token: null,
                admin: false,
                connections: {
                    discord: body.discord || null,
                },
            });
            await user.save();
            reply.code(201).send({ error: false, message: 'Registration successful' });
            $.debug(`Registered ${user.username} (${user.email})`);
        },
    });
    done();
};
