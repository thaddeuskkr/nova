import { User } from '../../models';
import type { Route } from '../../types';

export const routes: Route = (fastify, { $ }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/users/logout',
        handler: async (request, reply) => {
            if (typeof request.headers.authorization !== 'string') {
                reply.code(400).send({ error: true, message: 'This route requires the Authorization header to be set to a user token' });
                return;
            }
            const token = request.headers.authorization;
            const user = await User.findOne({ token });
            if (!user) {
                reply.code(401).send({ error: true, message: 'Invalid user token' });
                return;
            }
            user.token = null;
            await user.save();
            reply.code(200).send({ error: false, message: 'Logged out successfully' });
            $.debug(`${user.username} (${user.email}) logged out`);
        },
    });
    done();
};
