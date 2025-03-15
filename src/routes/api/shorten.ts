import { randomBytes } from 'crypto';
import parse from 'parse-duration';
import { Link } from '../../models';
import type { Route } from '../../types';

export const route: Route = {
    url: '/api/shorten',
    async request({ $, request, url, ip, config }) {
        if (request.method !== 'POST') {
            $.debug(`405 ${url.pathname} | ${ip}`);
            return new Response(
                JSON.stringify({
                    error: 'Method not allowed',
                }),
                {
                    status: 405,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }
        if (config.apiAuth.length) {
            const auth = request.headers.get('Authorization');
            if (!auth || !config.apiAuth.includes(auth)) {
                $.debug(`401 ${url.pathname} | ${ip}`);
                return new Response(
                    JSON.stringify({
                        error: 'Unauthorized',
                    }),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }
        }
        let body: {
            url?: string;
            slugs?: string[];
            description?: string;
            password?: string;
            expires?: string;
        };
        try {
            body = (await request.json()) as {
                url?: string;
                slugs?: string[];
                description?: string;
                password?: string;
                expires?: string;
            };
        } catch (error) {
            $.debug(`400 ${url.pathname} | ${ip}`);
            return new Response(
                JSON.stringify({
                    error: 'Request body should be in JSON format',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }
        if (!body.url) {
            $.debug(`400 ${url.pathname} | ${ip}`);
            return new Response(
                JSON.stringify({
                    error: 'Missing URL in request body',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }
        if (!isValidUrl(body.url)) {
            $.debug(`400 ${url.pathname} | ${ip}`);
            return new Response(
                JSON.stringify({
                    error: 'Invalid URL',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }
        const slugs: string[] = [];
        body.slugs = body.slugs?.map((slug) => slug.trim()).filter((slug) => slug.length > 0);
        if (!body.slugs?.length) {
            const randomSlug = await generateSlug(config.randomSlugLength);
            slugs.push(randomSlug);
        } else {
            if (await Link.findOne({ slugs: { $in: body.slugs } })) {
                $.debug(`400 ${url.pathname} | ${ip}`);
                return new Response(
                    JSON.stringify({
                        error: 'One or more shortened URLs are already in use',
                    }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }
            const prohibitedSlugs = body.slugs.filter((slug) => config.prohibitedSlugs.includes(slug));
            const slugsWithProhibitedCharacters = body.slugs.filter((slug) =>
                config.prohibitedCharacters.some((char) => slug.includes(char)),
            );
            if (prohibitedSlugs.length) {
                $.debug(`400 ${url.pathname} | ${ip}`);
                return new Response(
                    JSON.stringify({
                        error: `The following slugs are prohibited: ${prohibitedSlugs.join(', ')}`,
                    }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }
            if (slugsWithProhibitedCharacters.length) {
                $.debug(`400 ${url.pathname} | ${ip}`);
                return new Response(
                    JSON.stringify({
                        error: `The following slugs contain prohibited characters: ${slugsWithProhibitedCharacters.join(', ')}`,
                    }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }
            slugs.push(...body.slugs);
        }
        const expires = parse(body.expires);
        let expiry: Date | null = null;
        if (body.expires?.length) {
            if (expires === null) {
                $.debug(`400 ${url.pathname} | ${ip}`);
                return new Response(
                    JSON.stringify({
                        error: 'Invalid validity period. Please provide a valid duration string (e.g. 1m, 1h, 1d, 1w, 1y)',
                    }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            } else if (expires < 1000) {
                $.debug(`400 ${url.pathname} | ${ip}`);
                return new Response(
                    JSON.stringify({
                        error: 'Validity period must be at least 1 second',
                    }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            } else {
                expiry = new Date(Date.now() + expires);
            }
        }
        let password: string | null = null;
        if (body.password && body.password.length) {
            if (body.password.toLowerCase() === 'random') {
                password = generatePassword();
            } else {
                password = body.password;
            }
        }
        const link = await Link.insertOne({
            url: body.url,
            slugs,
            description: body.description || null,
            password: password ? await Bun.password.hash(password) : null,
            expiry,
        });
        return new Response(
            JSON.stringify({
                message: 'Link created successfully',
                link: {
                    id: link._id.toString(),
                    url: link.url,
                    description: link.description,
                    slugs: link.slugs,
                    password: link.password ? password : null,
                    expiry: link.expiry,
                    shortened: link.slugs.map((slug) => `https://${url.host}/${slug}${password ? `?${password}` : ''}`),
                },
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    },
};

async function generateSlug(length = 6): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    while (result.length < length) {
        const byte = randomBytes(1)[0];
        if (byte >= 256 - (256 % chars.length)) {
            continue;
        }
        result += chars[byte % chars.length];
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
        if (byte >= 256 - (256 % chars.length)) {
            continue;
        }
        password += chars[byte % chars.length];
    }
    return password;
}

function isValidUrl(string: string): boolean {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }
    return true;
}
