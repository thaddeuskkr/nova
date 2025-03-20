import { Html } from '@elysiajs/html';

const site = 'https://tkkr.link';
const name = 'Nova';
const description = 'A simple yet fast and feature-rich link shortener built using Bun.';
const keywords = 'nova,tk,tkkr,thaddeuskkr,thaddeus,kuah';
const color = '#000000';
const ogimage = 'https://tkkr.link/assets/ogimage.jpg';
const at = '@thaddeuskkr';
const author = 'Thaddeus Kuah';

export const Meta = () => (
    <head>
        <meta name='application-name' content={name} />
        <meta name='description' content={description} />
        <meta name='keywords' content={keywords} />
        <meta name='author' content={author} />
        <meta name='theme-color' content={color} />
        <meta property='og:title' content={name} />
        <meta property='og:description' content={description} />
        <meta property='og:image' content={ogimage} />
        <meta property='og:url' content={site} />
        <meta property='og:type' content='website' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content={at} />
        <meta name='twitter:title' content={name} />
        <meta name='twitter:description' content={description} />
        <meta name='twitter:image:src' content={ogimage} />
        <meta name='apple-mobile-web-app-title' content='Nova' />
    </head>
);
