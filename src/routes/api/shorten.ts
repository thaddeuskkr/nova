import { randomBytes } from 'crypto';
import { Elysia, t } from 'elysia';
import parse from 'parse-duration';
import { Link, User } from '../../models';
import type { Route } from '../../types';
import { getIP, isValidUrl, oidcUserAllowed } from '../../utils';

export const url: string = '/api/shorten';
export const route: Route = ({ $, config }) =>
    new Elysia().post(
        url,
        async ({ body, headers: { authorization }, set, request, server, path }) => {
            const ip = getIP(request, server);
            const user = authorization?.length ? await User.findOne({ token: authorization }) : null;
            if (config.apiAuth.length && (!authorization || !config.apiAuth.includes(authorization)) && !oidcUserAllowed(user)) {
                set.status = 401;
                $.debug(`401 ${path} | ${ip}`);
                return { error: 'Unauthorized' };
            }
            if (!isValidUrl(body.url)) {
                set.status = 400;
                $.debug(`400 ${path} | ${ip}`);
                return { error: 'Invalid URL' };
            }
            if (!body.slugs?.length) {
                body.slugs = [await generateSlug(config.randomSlugLength)];
            } else {
                if (await Link.findOne({ slugs: { $in: body.slugs } })) {
                    set.status = 400;
                    $.debug(`400 ${path} | ${ip}`);
                    return { error: 'One or more custom slugs are already in use' };
                }
                const prohibitedSlugs = body.slugs.filter((slug) => config.prohibitedSlugs.includes(slug));
                if (prohibitedSlugs.length) {
                    set.status = 400;
                    $.debug(`400 ${path} | ${ip}`);
                    return { error: `The following slugs are prohibited: ${prohibitedSlugs.join(', ')}` };
                }
            }
            let expiry: Date | null = null;
            let password: string | null = null;
            if (body.expires?.length) {
                const expires = parse(body.expires.trim() || '');
                if (expires === null) {
                    set.status = 400;
                    $.debug(`400 ${path} | ${ip}`);
                    return {
                        error: 'Invalid validity period. Please provide a valid duration string (e.g. 1m, 1h, 1d, 1w, 1y)',
                    };
                } else if (expires < 1000) {
                    set.status = 400;
                    $.debug(`400 ${path} | ${ip}`);
                    return { error: 'Validity period must be at least 1 second' };
                } else expiry = new Date(Date.now() + expires);
            }
            if (body.password?.length) {
                if (body.password.toLowerCase() === 'random') password = generatePassword();
                else password = body.password;
            }
            const link = await Link.insertOne({
                url: body.url,
                slugs: body.slugs,
                description: body.description || null,
                password: password ? await Bun.password.hash(password) : null,
                expiry,
            });
            return {
                message: 'Short URL created successfully',
                link: {
                    id: link._id.toString(),
                    url: link.url,
                    description: link.description,
                    slugs: link.slugs,
                    password: link.password ? password : null,
                    expiry: link.expiry,
                    shortened: link.slugs.map((slug) => `https://${new URL(request.url).host}/${slug}${password ? `?${password}` : ''}`),
                },
            };
        },
        {
            headers: t.Object({
                authorization: t.Optional(t.String()),
            }),
            body: t.Object({
                url: t.String(),
                slugs: t.Optional(
                    t.Union([
                        t.Array(
                            t.String({
                                minLength: 1,
                                maxLength: 64,
                                pattern: '^[a-zA-Z0-9-_.~]+$',
                            }),
                        ),
                        t.Null(),
                    ]),
                ),
                description: t.Optional(t.Union([t.String(), t.Null()])),
                password: t.Optional(t.Union([t.String(), t.Null()])),
                expires: t.Optional(t.Union([t.String(), t.Null()])),
            }),
            error: ({ set, code, error, request, server, path }) => {
                const ip = getIP(request, server);
                if (code !== 'VALIDATION') throw error;
                set.status = 400;
                $.debug(`400 ${path} | ${ip}`);
                return { errors: [...error.validator.Errors(error.value)].map((e) => e.message) };
            },
        },
    );

async function generateSlug(length = 6): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    while (result.length < length) {
        const byte = randomBytes(1)[0];
        if (byte! >= 256 - (256 % chars.length)) continue;
        result += chars[byte! % chars.length];
    }
    const existingSlug = await Link.findOne({ slugs: result });
    if (existingSlug) return generateSlug(length);
    return result;
}

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    while (password.length < length) {
        const byte = randomBytes(1)[0];
        if (byte! >= 256 - (256 % chars.length)) continue;
        password += chars[byte! % chars.length];
    }
    return password;
}
