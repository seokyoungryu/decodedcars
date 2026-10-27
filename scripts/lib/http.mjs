// Polite HTTP: identifiable User-Agent (Wikimedia requires one with contact info),
// retries with backoff, and conditional downloads so unchanged bulk files are not fetched again.
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { CACHE, readJson, writeJson } from './store.mjs';

export const USER_AGENT = `CarRadarBot/0.1 (${process.env.SITE_CONTACT || 'https://github.com/'}; static vehicle-safety site, daily batch)`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getJson(url, { tries = 5, headers = {} } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT, ...headers }, signal: AbortSignal.timeout(60000) });
      if (res.status === 404) return null;
      if (res.ok) return await res.json();
      last = new Error(`${res.status} ${url}`);
      if (res.status < 500 && res.status !== 429) throw last;
      // rate limited: wait as long as the server asks (Wikimedia sends Retry-After), at least 5 s
      if (res.status === 429) {
        await sleep(Math.max(5000 * 2 ** i, Number(res.headers.get('retry-after') || 0) * 1000));
        continue;
      }
    } catch (e) {
      last = e;
    }
    await sleep(1500 * 2 ** i);
  }
  throw last;
}

/** Download url → file only if it changed since last time (ETag / Last-Modified). Returns true if a new copy was saved. */
export async function download(url, file) {
  const metaFile = CACHE + 'downloads.json';
  const meta = await readJson(metaFile, {});
  const prev = existsSync(file) ? meta[url] : undefined;
  const headers = { 'User-Agent': USER_AGENT };
  if (prev?.etag) headers['If-None-Match'] = prev.etag;
  if (prev?.modified) headers['If-Modified-Since'] = prev.modified;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15 * 60000) });
  if (res.status === 304) return false;
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await mkdir(dirname(file), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file + '.part'));
  await rename(file + '.part', file);
  meta[url] = { etag: res.headers.get('etag'), modified: res.headers.get('last-modified'), at: new Date().toISOString() };
  await writeJson(metaFile, meta);
  return true;
}
