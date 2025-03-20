import { Html } from '@elysiajs/html';
import { Elysia } from 'elysia';
import { Link } from '../models';
import { Base } from '../templates/base';
import type { Route } from '../types';
import { getIP } from '../utils';

export const url: string = '*';
export const route: Route = ({ version }) =>
    new Elysia().get(url, async ({ request, redirect, server, path, query, set }) => {
        const ip = getIP(request, server);
        const link = await Link.findOne({ slugs: path.slice(1) });
        if (!link) {
            set.status = 404;
            return (
                <Base title='Nova • 404' version={version} ip={ip}>
                    <h1 class='mb-4 text-3xl font-bold'>
                        <a href='/' class='transition-colors hover:text-gray-400'>
                            404
                        </a>
                    </h1>
                    <p class='text-gray-400'>
                        The requested URL (<code class='rounded-md bg-gray-900 px-1'>{path}</code>) was not found.
                        <br />
                        Please ensure that the URL you entered is correct.
                        <br />
                    </p>
                </Base>
            );
        }
        if (link.password) {
            const userPassword = Object.keys(query)[0];
            if (!userPassword) {
                set.status = 401;
                return (
                    <Base title='Nova • 401' version={version} ip={ip}>
                        <h1 class='mb-4 text-3xl font-bold text-gray-300'>
                            <a href='/' class='transition-colors hover:text-gray-400'>
                                401
                            </a>
                        </h1>
                        <p class='text-gray-400'>
                            Incorrect password provided in URL.
                            <br />
                            Please ensure that the URL you entered is correct.
                        </p>
                    </Base>
                );
            }
            const verified = await Bun.password.verify(userPassword, link.password);
            if (!verified) {
                set.status = 401;
                return (
                    <Base title='Nova • 401' version={version} ip={ip}>
                        <h1 class='mb-4 text-3xl font-bold text-gray-300'>
                            <a href='/' class='transition-colors hover:text-gray-400'>
                                401
                            </a>
                        </h1>
                        <p class='text-gray-400'>
                            Incorrect password provided in URL.
                            <br />
                            Please ensure that the URL you entered is correct.
                        </p>
                    </Base>
                );
            }
        }
        link.clicks ? link.clicks++ : (link.clicks = 1);
        await link.save();
        return redirect(link.url, 307);
    });
