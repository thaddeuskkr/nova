import { randomBytes } from 'crypto';
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
        if (config.apiAuth && config.apiAuth.length && config.apiAuth.toLowerCase() !== 'false') {
            const auth = request.headers.get('Authorization');
            if (!auth || auth !== config.apiAuth) {
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
        };
        try {
            body = (await request.json()) as {
                url?: string;
                slugs?: string[];
                description?: string;
                password?: string;
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
        if (!isValidHttpUrl(body.url)) {
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
        if (!body.slugs || !body.slugs.length) {
            const randomSlug = await generateSlug(config.randomSlugLength);
            slugs.push(randomSlug);
        } else {
            for (const userSlug of body.slugs) {
                if (!userSlug.length) continue;
                const existingSlug = await Link.findOne({ slugs: userSlug });
                if (existingSlug) {
                    $.debug(`400 ${url.pathname} | ${ip}`);
                    return new Response(
                        JSON.stringify({
                            error: `Slug "${userSlug}" is already taken`,
                        }),
                        {
                            status: 400,
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        },
                    );
                }
                slugs.push(userSlug);
            }
            if (!slugs.length) {
                const randomSlug = await generateSlug(config.randomSlugLength);
                slugs.push(randomSlug);
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
                    shortened: link.slugs.map((slug) => `${url.origin}/${slug}${password ? `?p=${password}` : ''}`),
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
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i]! % chars.length];
    }
    const existingSlug = await Link.findOne({ slugs: result });
    if (existingSlug) return generateSlug(length);

    return result;
}

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i]! % chars.length];
    }
    return password;
}

function isValidHttpUrl(string: string): boolean {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
}
