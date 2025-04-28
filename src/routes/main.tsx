import { Html } from '@elysiajs/html';
import { Elysia, t } from 'elysia';
import { User } from '../models';
import { Base } from '../templates/base';
import type { Route } from '../types';
import { getIP, oidcUserAllowed } from '../utils';

export const url: string = '/';
export const route: Route = ({ $, version, config }) =>
    new Elysia().get(
        url,
        async ({ server, request, redirect, query, set, path, cookie: { token } }) => {
            const ip = getIP(request, server);
            const user = token.value?.length ? await User.findOne({ token: token.value }) : null;
            const apiAuth = Object.keys(query)[0];
            set.headers['content-type'] = 'text/html';
            if (!config.apiAuth.length || (apiAuth && config.apiAuth.includes(apiAuth)) || oidcUserAllowed(user)) {
                return (
                    <Base title='Nova' version={version} ip={ip}>
                        <script src='/public/js/shorten.js' type='text/javascript'></script>
                        <form id='shorten' class='flex w-full flex-col space-y-2 text-left'>
                            <h1 class='mb-4 text-center text-2xl font-bold'>{user ? `Hello, ${user.given_name}!` : 'Hello!'}</h1>
                            <input
                                type='url'
                                name='url'
                                id='url'
                                class='w-full rounded-md bg-gray-900 px-2 py-1 text-center focus:placeholder-transparent focus:outline-none'
                                placeholder='Enter a URL to shorten'
                                required
                            />
                            <input
                                type='text'
                                id='slugs'
                                name='slugs'
                                class='w-full rounded-md bg-gray-900 px-2 py-1 text-center focus:placeholder-transparent focus:outline-none'
                                placeholder='Custom slugs, comma-separated (optional)'
                            />
                            <input
                                type='text'
                                id='expiry'
                                name='expiry'
                                class='w-full rounded-md bg-gray-900 px-2 py-1 text-center focus:placeholder-transparent focus:outline-none'
                                placeholder='Expires in (optional, e.g. 5m, 1h, 7d)'
                            />
                            <input
                                type='text'
                                id='password'
                                name='password'
                                class='w-full rounded-md bg-gray-900 px-2 py-1 text-center focus:placeholder-transparent focus:outline-none'
                                placeholder='Password (optional, accepts "random")'
                            />
                            <button
                                type='submit'
                                class='w-full cursor-pointer rounded-md bg-gray-800 px-2 py-1 transition-colors hover:bg-gray-700 hover:text-gray-100'>
                                Shorten
                            </button>
                            {config.googleOIDC.clientId && config.googleOIDC.clientSecret && config.googleOIDC.redirectUri ?
                                <a href='/api/auth/logout' class='mt-2 text-center underline transition-colors hover:text-gray-400'>
                                    Sign out
                                </a>
                            :   ''}
                        </form>
                        <div class='hidden flex-col items-center justify-center space-y-2' id='result'>
                            <h1 class='text-2xl font-bold'>Link shortened!</h1>
                            <p id='result-message'>Here are your shortened URLs:</p>
                            <ul id='links-list'></ul>
                            <p id='expiry-message'></p>
                            <a
                                id='another'
                                class='mt-2 w-fit cursor-pointer rounded-md bg-gray-800 px-2 py-1 transition-colors hover:bg-gray-700 hover:text-gray-100'>
                                Shorten another URL
                            </a>
                        </div>
                    </Base>
                );
            }
            if (config.baseUrlRedirect.length && config.baseUrlRedirect.toLowerCase() !== 'false') {
                $.debug(`307 ${path} | ${ip}`);
                return redirect(config.baseUrlRedirect, 307);
            }
            return (
                <Base title='Nova' version={version} ip={ip}>
                    <h1 class='mb-4 text-2xl font-bold'>Nova</h1>
                    <p class='text-gray-400'>A simple yet relatively feature-rich link shortener.</p>
                    {config.googleOIDC.clientId && config.googleOIDC.clientSecret && config.googleOIDC.redirectUri ?
                        <a href='/api/auth/google' class='mt-2 underline transition-colors hover:text-gray-400'>
                            Sign in with Google
                        </a>
                    :   ''}
                </Base>
            );
        },
        {
            cookie: t.Cookie({
                token: t.Optional(t.String()),
            }),
        },
    );
