import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { User } from '../../models.js';
import type { Route } from '../../types.js';

export const routes: Route = (fastify, { $ }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/users/login',
        handler: async (request, reply) => {
            const body = request.body as { username?: string; password?: string } | undefined;
            if (!body) {
                reply.code(400).send({ error: true, message: 'Missing request body' });
                return;
            }
            if (!body.username || !body.password) {
                reply.code(400).send({ error: true, message: 'Missing required fields' });
                return;
            }
            const user = await User.findOne({ $or: [{ username: body.username.toLowerCase() }, { email: body.username.toLowerCase() }] });
            if (!user) return reply.code(401).send({ error: true, message: 'User not found' });
            if (!bcrypt.compareSync(body.password, user.password)) return reply.code(401).send({ error: true, message: 'Password does not match' });
            user.token = user.token || crypto.randomBytes(128).toString('base64');
            await user.save();
            reply.code(200).send({ error: false, message: `Logged in as ${user.username}`, token: user.token });
            $.debug(`${user.username} (${user.email}) logged in`);
        },
    });
    done();
};
