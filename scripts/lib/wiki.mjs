// Model overview + photo from Wikipedia/Wikimedia Commons.
//   Summary text: English Wikipedia lead (CC BY-SA 4.0) — shown short, unmodified, with source link and license.
//   Photo: the article's lead image ONLY if it is on Commons under a free license (CC0 / public domain / CC BY / CC BY-SA);
//          author + license + file page are stored and shown under the photo. Non-free (enwiki fair-use) images are skipped.
// Cached per article and refreshed every 30 days. Thumbnails are downloaded once (gentle, identified User-Agent).
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { CACHE, readJson, today, writeJson } from './store.mjs';
import { USER_AGENT, getJson } from './http.mjs';

const FILE = CACHE + 'wiki.json';
export const PHOTO_DIR = CACHE + 'photos/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FREE = /^(cc0|cc[ -]by(-sa)?[ -][\d.]+|public domain|pd\b|pd-)/i;
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const fileName = (title) => title.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 80);

/** titles: unique Wikipedia article titles. Returns { [title]: { extract, url, photo? } } */
export async function collectWiki(titles, { budget = 900, log }) {
  const cache = await readJson(FILE, {});
  await mkdir(PHOTO_DIR, { recursive: true });
  const stale = (e) => !e || Date.parse(today()) - Date.parse(e.at) > 30 * 86400e3;
  const todo = titles.filter((t) => stale(cache[t]));
  let n = 0;
  let photos = 0;
  for (const title of todo) {
    if (n >= budget) break;
    n++;
    try {
      const s = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
      if (!s?.extract) {
        cache[title] = { at: today() };
        continue;
      }
      const entry = { at: today(), extract: s.extract.length > 700 ? s.extract.slice(0, s.extract.lastIndexOf('. ', 700) + 1) : s.extract, url: s.content_urls?.desktop?.page };
      const src = s.originalimage?.source ?? s.thumbnail?.source ?? '';
      // Commons-hosted only (upload. or thumb.wikimedia.org …/commons/…); /wikipedia/en/ files are non-free and skipped
      const m = src.match(/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
      if (m) {
        const file = decodeURIComponent(m[1]);
        const j = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800&titles=${encodeURIComponent('File:' + file)}`);
        const ii = Object.values(j?.query?.pages ?? {})[0]?.imageinfo?.[0];
        const md = ii?.extmetadata ?? {};
        const lic = strip(md.LicenseShortName?.value);
        if (ii?.thumburl && FREE.test(lic)) {
          const local = `${fileName(title)}.jpg`;
          if (!existsSync(PHOTO_DIR + local)) {
            const res = await fetch(ii.thumburl, { headers: { 'User-Agent': USER_AGENT } });
            if (res.ok) await writeFile(PHOTO_DIR + local, Buffer.from(await res.arrayBuffer()));
          }
          if (existsSync(PHOTO_DIR + local)) {
            entry.photo = {
              file: local,
              w: ii.thumbwidth,
              h: ii.thumbheight,
              caption: strip(md.ObjectName?.value) || file.replace(/\.[a-z]+$/i, '').replace(/_/g, ' '),
              artist: strip(md.Artist?.value).slice(0, 80) || 'Unknown author',
              license: lic,
              licenseUrl: md.LicenseUrl?.value,
              page: ii.descriptionurl,
            };
            photos++;
          }
        }
      }
      cache[title] = entry;
    } catch (e) {
      log(`  wiki ${title}: ${e.message}`);
    }
    await sleep(250);
  }
  await writeJson(FILE, cache);
  log(`Wikipedia summaries/photos: ${n} articles checked, ${photos} free photos saved, ${Math.max(0, todo.length - n)} left`);
  return cache;
}
