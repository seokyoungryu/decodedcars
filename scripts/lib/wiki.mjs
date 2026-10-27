// Wikipedia article per model (title, overview text, free photo) — the single place where article titles are chosen.
//   Title: "Make Model" is often an index/disambiguation page (e.g. "Honda Odyssey" lists a minivan AND a 1979 ATV),
//          so every candidate is checked: not a disambiguation/index page, and its description must say it is a car.
//          If the plain title fails we try "(North America)", "(automobile)", "(car)", "(SUV)", "(minivan)", "(pickup truck)".
//   Text:  English Wikipedia lead (CC BY-SA 4.0) — shown short, unmodified, with source link and license.
//   Photo: the article's lead image ONLY if it is on Commons under a free license (CC0 / PD / CC BY / CC BY-SA),
//          and its caption does not look like a different vehicle (ATV, motorcycle, very old year). Author + license kept.
// Results cached; re-checked every 30 days. The pageviews step uses the titles chosen here.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { CACHE, readJson, today, writeJson } from './store.mjs';
import { USER_AGENT, getJson } from './http.mjs';
import { norm } from './keys.mjs';

const FILE = CACHE + 'wiki.json';
export const TITLES = CACHE + 'wiki-titles.json';
export const PHOTO_DIR = CACHE + 'photos/';
const VERSION = 2; // bump when the checks change, so everything is re-checked
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FREE = /^(cc0|cc[ -]by(-sa)?[ -][\d.]+|public domain|pd\b|pd-)/i;
const CARLIKE = /\b(cars?|automobiles?|vehicles?|suvs?|crossovers?|minivans?|mpvs?|vans?|trucks?|pickups?|sedans?|saloons?|coupes?|coupés?|hatchbacks?|roadsters?|convertibles?|supercars?|hypercars?|grand tourers?|wagons?|estates?|limousines?|model series)\b/i;
const NOT_CAR = /\b(atv|all-terrain|motorcycles?|motorbikes?|scooters?|dune buggy|buggy|quad|go-kart|snowmobiles?|outboard|lawn mower|tractors?|aircraft|boats?|engine family)\b/i;
const SUFFIXES = ['', ' (North America)', ' (automobile)', ' (car)', ' (SUV)', ' (minivan)', ' (pickup truck)', ' (crossover)'];
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const fileName = (title) => title.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 80);
/** "Golf/GTI" → GOLF, "CR-V" → CRV, "Model 3" → MODEL3: the part of the name an article or photo caption must contain */
const modelToken = (model) => {
  const first = norm(model.split(/[s/]/)[0]);
  return first.length >= 3 && !/^(MODEL|GRAND|SERIES|NEW)$/.test(first) ? first : norm(model).slice(0, 12);
};

async function summary(title) {
  const s = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  await sleep(150);
  return s;
}

/** Is this summary a real article about a car (not an index page, not an ATV)? */
function isCarArticle(s, model) {
  if (!s?.extract || s.type === 'disambiguation') return false;
  const desc = `${s.description ?? ''}`;
  if (/index of articles|may refer to|disambiguation|topics referred to/i.test(desc) || /can refer to|may refer to/i.test(s.extract.slice(0, 160))) return false;
  if (NOT_CAR.test(desc)) return false;
  // the article must mention the model name and describe a road vehicle somewhere near the top
  const top = `${desc} ${s.extract.slice(0, 400)}`;
  return CARLIKE.test(top) && norm(top).includes(modelToken(model));
}

/** Free, plausible lead photo for the article, or undefined */
async function photoFor(s, title, model, firstYear) {
  const src = s.originalimage?.source ?? s.thumbnail?.source ?? '';
  // Commons-hosted only (upload. or thumb.wikimedia.org …/commons/…); /wikipedia/en/ files are non-free and skipped
  const m = src.match(/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
  if (!m) return undefined;
  const file = decodeURIComponent(m[1]);
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800&titles=${encodeURIComponent('File:' + file)}`);
  const ii = Object.values(j?.query?.pages ?? {})[0]?.imageinfo?.[0];
  const md = ii?.extmetadata ?? {};
  const lic = strip(md.LicenseShortName?.value);
  if (!ii?.thumburl || !FREE.test(lic)) return undefined;
  const caption = strip(md.ObjectName?.value) || file.replace(/\.[a-z]+$/i, '').replace(/_/g, ' ');
  const text = `${caption} ${file} ${strip(md.ImageDescription?.value).slice(0, 300)}`;
  if (NOT_CAR.test(text)) return undefined;
  // a photo dated long before the first model year we cover is probably an older, different vehicle
  const years = [...text.matchAll(/\b(19[5-9]\d|20[0-4]\d)\b/g)].map((x) => Number(x[1]));
  if (years.length && Math.max(...years) < firstYear - 12) return undefined;
  // the caption/file should name the model (catches lead images of a different car)
  if (!norm(text).includes(modelToken(model))) return undefined;
  const local = `${fileName(title)}.jpg`;
  if (!existsSync(PHOTO_DIR + local)) {
    const res = await fetch(ii.thumburl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return undefined;
    await writeFile(PHOTO_DIR + local, Buffer.from(await res.arrayBuffer()));
  }
  return {
    file: local,
    w: ii.thumbwidth,
    h: ii.thumbheight,
    caption,
    artist: strip(md.Artist?.value).slice(0, 80) || 'Unknown author',
    license: lic,
    licenseUrl: md.LicenseUrl?.value,
    page: ii.descriptionurl,
  };
}

/**
 * models: [{ key, make, model, firstYear }]. Chooses + validates a title per model, fetches overview and photo.
 * Returns { titles: { key: title|null }, wiki: { title: { extract, url, photo? } } }
 */
export async function collectWiki(models, { budget = 1500, log }) {
  const titles = await readJson(TITLES, {});
  const cache = await readJson(FILE, {});
  await mkdir(PHOTO_DIR, { recursive: true });
  const fresh = (e) => e && e.v === VERSION && Date.parse(today()) - Date.parse(e.at) < 30 * 86400e3;
  let calls = 0;
  let checked = 0;
  let rejected = 0;
  let photos = 0;
  for (const m of models) {
    const prev = cache[`#${m.key}`];
    if (fresh(prev)) continue;
    if (calls >= budget) break;
    checked++;
    let found = null;
    // "Golf/GTI" → also try "Golf"
    const names = [...new Set([m.model, m.model.split('/')[0].trim()])];
    search: for (const name of names)
      for (const suf of SUFFIXES) {
        const s = await summary(`${m.make} ${name}${suf}`).catch(() => null);
        calls++;
        if (isCarArticle(s, name)) {
          found = s;
          break search;
        }
        if (suf === '' && name === m.model && s?.extract) rejected++;
      }
    const title = found?.title ?? null;
    titles[m.key] = title;
    cache[`#${m.key}`] = { v: VERSION, at: today(), title };
    if (found && !fresh(cache[title])) {
      const entry = { v: VERSION, at: today(), extract: found.extract.length > 700 ? found.extract.slice(0, found.extract.lastIndexOf('. ', 700) + 1) : found.extract, url: found.content_urls?.desktop?.page };
      try {
        entry.photo = await photoFor(found, title, m.model, m.firstYear);
        calls++;
      } catch (e) {
        log(`  photo ${title}: ${e.message}`);
      }
      if (entry.photo) photos++;
      cache[title] = entry;
    }
    if (checked % 100 === 0) {
      await writeJson(FILE, cache);
      await writeJson(TITLES, titles);
    }
  }
  await writeJson(FILE, cache);
  await writeJson(TITLES, titles);
  const left = models.filter((m) => !fresh(cache[`#${m.key}`])).length;
  log(`Wikipedia: ${checked} models checked (${rejected} plain titles rejected as index/non-car pages), ${photos} photos, ${left} left`);
  return { titles, wiki: cache };
}
