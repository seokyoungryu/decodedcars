// Paths kept out of search (thin model-years). Written by aggregate.mjs, read by the sitemap filter and pages.
import { readFileSync } from 'node:fs';
import { SITE } from './store.mjs';

export function noindexPaths() {
  try {
    return new Set(JSON.parse(readFileSync(SITE + 'noindex.json', 'utf8')));
  } catch {
    return new Set();
  }
}
