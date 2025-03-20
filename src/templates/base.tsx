import { Html } from '@elysiajs/html';
import type { Children } from '@kitajs/html';
import { Meta } from './meta';

export const Base = ({ title, children, version, ip }: { title: string; children: Children; version: string; ip: string }) =>
    '<!DOCTYPE html>' +
    (
        <html lang='en'>
            <head>
                <meta charset='UTF-8' />
                <meta name='viewport' content='width=device-width, initial-scale=1.0' />
                <title>{title}</title>
                <link rel='stylesheet' href='/public/css/build.css' />
                <link rel='icon' type='image/png' href='/public/icons/favicon-96x96.png' sizes='96x96' />
                <link rel='icon' type='image/svg+xml' href='/public/icons/favicon.svg' />
                <link rel='shortcut icon' href='/public/icons/favicon.ico' />
                <link rel='apple-touch-icon' sizes='180x180' href='/public/icons/apple-touch-icon.png' />
                <link rel='manifest' href='/public/icons/site.webmanifest' />
                <Meta />
            </head>
            <body class='m-0 flex h-screen w-screen bg-gray-950 p-0 text-gray-300'>
                <div class='m-auto w-full max-w-lg p-2 text-center'>
                    {children}
                    <p class='mt-4 text-sm text-gray-500'>
                        <a
                            href='https://github.com/thaddeuskkr/nova'
                            target='_blank'
                            rel='noreferrer noopener'
                            class='transition-colors hover:text-gray-600'>
                            Nova by thaddeuskkr • {version}
                        </a>
                        <br />
                        Your IP address is <code class='rounded-md bg-gray-900 px-1'>{ip}</code>
                    </p>
                </div>
            </body>
        </html>
    );
