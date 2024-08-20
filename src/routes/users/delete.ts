import { User } from '../../models.js';
import type { Route } from '../../types.js';

export const routes: Route = (fastify, { $ }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/users/delete',
        handler: async (request, reply) => {
            if (typeof request.headers.authorization !== 'string') {
                reply.code(400).send({ error: true, message: 'This route requires the Authorization header to be set to a user token' });
                return;
            }
            const token = request.headers.authorization;
            const body = request.body as { user?: string } | undefined;
            const user = await User.findOne({ token });
            if (!user) {
                reply.code(401).send({ error: true, message: 'Invalid user token' });
                return;
            }
            if (!body || !body.user) {
                await User.findByIdAndDelete(user._id);
                reply.code(200).send({ error: false, message: 'Deleted user successfully' });
                $.debug(`${user.username} (${user.email}) deleted`);
            } else {
                if (!user.admin) {
                    reply.code(401).send({ error: true, message: 'You do not have permission to delete other users' });
                    return;
                }
                const deletedUser = await User.findOneAndDelete({ $or: [{ username: body.user }, { email: body.user }] });
                if (!deletedUser) {
                    reply.code(404).send({ error: true, message: 'User not found' });
                    return;
                }
                reply.code(200).send({ error: false, message: 'Deleted user successfully' });
                $.debug(`${deletedUser.username} (${deletedUser.email}) deleted by ${user.username} (${user.email})`);
            }
        },
    });
    done();
};
