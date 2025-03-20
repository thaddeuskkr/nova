import { randomBytes } from 'crypto';
import { Elysia, t } from 'elysia';
import parse from 'parse-duration';
import { Link } from '../../models';
import type { Route } from '../../types';

export const url: string = '/api/shorten';
export const route: Route = ({ config }) =>
    new Elysia().post(
        url,
        async ({ body, headers: { authorization }, set, request }) => {
            if (config.apiAuth.length && (!authorization || !config.apiAuth.includes(authorization))) {
                set.status = 401;
                return { error: 'Unauthorized' };
            }
            if (!body.slugs?.length) {
                body.slugs = [await generateSlug(config.randomSlugLength)];
            } else {
                if (await Link.findOne({ slugs: { $in: body.slugs } })) {
                    set.status = 400;
                    return { error: 'One or more custom slugs are already in use' };
                }
                const prohibitedSlugs = body.slugs.filter((slug) => config.prohibitedSlugs.includes(slug));
                if (prohibitedSlugs.length) {
                    set.status = 400;
                    return { error: `The following slugs are prohibited: ${prohibitedSlugs.join(', ')}` };
                }
            }
            let expiry: Date | null = null;
            let password: string | null = null;
            if (body.expires?.length) {
                const expires = parse(body.expires.trim() || '');
                if (expires === null) {
                    set.status = 400;
                    return {
                        error: 'Invalid validity period. Please provide a valid duration string (e.g. 1m, 1h, 1d, 1w, 1y)',
                    };
                } else if (expires < 1000) {
                    set.status = 400;
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
                url: t.String({
                    format: 'uri',
                }),
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
            error: ({ error, code }) => {
                if (code !== 'VALIDATION') throw error;
                return { error: error.message };
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
