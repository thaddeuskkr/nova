import bcrypt from 'bcrypt';
import { User } from '../../models.js';
import type { Route } from '../../types.js';

export const routes: Route = (fastify, { $ }, done) => {
    fastify.route({
        method: ['POST'],
        url: '/api/users/update',
        handler: async (request, reply) => {
            if (typeof request.headers.authorization !== 'string') {
                reply.code(400).send({ error: true, message: 'This route requires the Authorization header to be set to a user token' });
                return;
            }
            const token = request.headers.authorization;
            const body = request.body as {
                user?: string;
                username?: string;
                email?: string;
                password?: string;
                icon?: string;
                admin?: string;
                discord?: string;
            } | undefined;
            const user = await User.findOne({ token });
            if (!user) {
                reply.code(401).send({ error: true, message: 'Invalid user token' });
                return;
            }
            if (!body) {
                reply.code(400).send({ error: true, message: 'Missing request body' });
                return;
            }
            if (body.user) {
                if (!user.admin) {
                    reply.code(401).send({ error: true, message: 'You do not have permission to edit other users' });
                    return;
                }
                if (await User.exists({
                    $or: [
                        { username: body.username?.toLowerCase() },
                        { email: body.username?.toLowerCase() },
                        { username: body.email?.toLowerCase() },
                        { email: body.email?.toLowerCase() },
                    ],
                })) {
                    reply.code(400).send({ error: true, message: 'Username or email already in use' });
                    return;
                }
                const userToEdit = await User.findOne({ $or: [{ username: body.user.toLowerCase() }, { email: body.user.toLowerCase() }] });
                if (!userToEdit) {
                    reply.code(404).send({ error: true, message: 'User not found' });
                    return;
                }
                const editedUser = await User.findByIdAndUpdate(userToEdit._id, {
                    username: body.username?.toLowerCase() || userToEdit.username,
                    email: body.email?.toLowerCase() || userToEdit.email,
                    password: body.password ? bcrypt.hashSync(body.password, 10) : userToEdit.password,
                    icon: body.icon ? (body.icon === 'null' ? null : body.icon) : userToEdit.icon,
                    admin: body.admin ? body.admin === 'true' : userToEdit.admin,
                    connections: {
                        discord: body.discord || userToEdit.connections?.discord || null,
                    },
                }, { new: true });
                if (!editedUser) {
                    reply.code(404).send({ error: true, message: 'User not found' });
                    return;
                }
                reply.code(200).send({ error: false, message: 'Edited user successfully' });
                $.debug(`${editedUser.username} (${editedUser.email}) edited by ${user.username} (${user.email})`);
            } else {
                if (await User.exists({
                    $or: [
                        { username: body.username?.toLowerCase() },
                        { email: body.username?.toLowerCase() },
                        { username: body.email?.toLowerCase() },
                        { email: body.email?.toLowerCase() },
                    ],
                })) {
                    reply.code(400).send({ error: true, message: 'Username or email already in use' });
                    return;
                }
                await User.findByIdAndUpdate(user._id, {
                    username: body.username?.toLowerCase() || user.username,
                    email: body.email?.toLowerCase() || user.email,
                    password: body.password ? bcrypt.hashSync(body.password, 10) : user.password,
                    icon: body.icon ? (body.icon === 'null' ? null : body.icon) : user.icon,
                    connections: {
                        discord: body.discord || user.connections?.discord || null,
                    },
                });
                reply.code(200).send({ error: false, message: 'Edited user successfully' });
                $.debug(`${user.username} (${user.email}) edited`);
            }
        },
    });
    done();
};
