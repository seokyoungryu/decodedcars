// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config/site-url.mjs';
import { noindexPaths } from './scripts/lib/noindex.mjs';

const hidden = noindexPaths();

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // Pages we keep out of search (thin model-years, 404) stay out of the sitemap too
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return !/\/404$/.test(path) && !hidden.has(path);
      },
    }),
  ],
});
