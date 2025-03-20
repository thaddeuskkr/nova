import { Html } from '@elysiajs/html';
import type { Children } from '@kitajs/html';

export const Base = ({ title, children, version, ip }: { title: string; children: Children; version: string; ip: string }) =>
    '<!DOCTYPE html>' +
    (
        <html lang='en'>
            <head>
                <meta charset='UTF-8' />
                <meta name='viewport' content='width=device-width, initial-scale=1.0' />
                <title>{title}</title>
                <link rel='stylesheet' href='/public/css/build.css' />
                <link rel='icon' href='/public/icons/favicon.ico' />
                <link rel='apple-touch-icon' href='/public/icons/apple-touch-icon.png' />
            </head>
            <body class='m-0 flex h-screen w-screen bg-gray-950 p-0 text-gray-300'>
                <div class='m-auto w-full max-w-lg p-2 text-center'>
                    {children}
                    <p class='mt-4 text-sm text-gray-500'>
                        <a href='https://github.com/thaddeuskkr/nova' class='transition-colors hover:text-gray-600'>
                            Nova by thaddeuskkr • v{version}
                        </a>
                        <br />
                        Your IP address is <code class='rounded-md bg-gray-900 px-1'>{ip}</code>
                    </p>
                </div>
            </body>
        </html>
    );
