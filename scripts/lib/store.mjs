// Data folders
//   data/cache/  raw downloads + slow-changing API results (carried between runs by the Actions cache, never committed)
//   data/site/   processed output that the Astro build reads
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../data/', import.meta.url));
export const CACHE = ROOT + 'cache/';
export const SITE = ROOT + 'site/';

export async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}
export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value));
}

export const today = () => new Date().toISOString().slice(0, 10);
export const daysAgo = (n) => new Date(Date.now() - n * 86400e3).toISOString().slice(0, 10);
/** NHTSA dates are YYYYMMDD → YYYY-MM-DD */
export const isoDate = (s) => (s && /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : undefined);
