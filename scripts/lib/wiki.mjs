// Wikipedia article per model (title, overview text, free photo) — the single place where article titles are chosen.
//   Title: "Make Model" is often an index/disambiguation page (e.g. "Honda Odyssey" lists a minivan AND a 1979 ATV)
//          or an article about an old car that shares the name ("Aston Martin DBS" is the 1967 car), so every candidate
//          is checked: not a disambiguation/index page, its description must say it is a car, and it must not be about
//          a car whose production ended long before the years we cover. If the plain title fails we try suffixes like
//          "(North America)", "(automobile)", "(SUV)", then Wikipedia search results named exactly like the model.
//   Text:  English Wikipedia lead (CC BY-SA 4.0) — shown short, unmodified, with source link and license.
//   Photo: a JPEG of the article that is on Commons under a free license (CC0 / PD / CC BY / CC BY-SA), whose caption
//          names the model, is not an interior/engine/logo/race-car shot and is not dated outside the years we cover.
//          Lead image first; if it fails, the article's other images, newest model year preferred. Chosen per model
//          (several models can share an article: Sedona → "Kia Carnival"), never from photo-blocklist.json
//          (files found unusable on manual review).
// Results cached; re-checked every 30 days. The pageviews step uses the titles chosen here.
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { CACHE, readJson, today, writeJson } from './store.mjs';
import { USER_AGENT, getJson } from './http.mjs';
import { norm } from './keys.mjs';

const FILE = CACHE + 'wiki.json';
export const TITLES = CACHE + 'wiki-titles.json';
export const PHOTO_DIR = CACHE + 'photos/';
const VERSION = 6; // bump when the checks change, so everything is re-checked
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FREE = /^(cc0|cc[ -]by(-sa)?[ -][\d.]+|public domain|pd\b|pd-)/i;
const CARLIKE = /\b(cars?|automobiles?|vehicles?|suvs?|crossovers?|minivans?|mpvs?|vans?|trucks?|pickups?|sedans?|saloons?|coupes?|coupés?|hatchbacks?|roadsters?|convertibles?|supercars?|hypercars?|grand tourers?|wagons?|estates?|limousines?|model series)\b/i;
const NOT_CAR = /\b(atv|all-terrain|motorcycles?|motorbikes?|scooters?|dune buggy|buggy|quad|go-kart|snowmobiles?|outboard|lawn mower|tractors?|aircraft|boats?|engine family)\b/i;
// not a photo of the whole road car
const NOT_PHOTO = /\b(interior|innenraum|dash|dashboard|cockpit|steering|console|engine|motor ?room|rear|badge|emblem|logo|wheels?|rims?|seats?|trunk|boot|rally|wrc|race|racing|tcr|lms|gt3|gt4|formula|grand prix|limo|limousine|stretch(ed)?|concept|prototyp(e)?|erlkönig|camouflage|hrc|6x6|heck|innen)\b/i;
const BLOCKLIST = JSON.parse(readFileSync(new URL('./photo-blocklist.json', import.meta.url), 'utf8'));
const BLOCK = new Set(BLOCKLIST.files.map((f) => f.replace(/ /g, '_')));
const NO_PHOTO = new Set(BLOCKLIST.models);
const blocked = (f) => BLOCK.has(f) || BLOCKLIST.prefixes.some((p) => f.startsWith(p));
const SUFFIXES = ['', ' (North America)', ' (automobile)', ' (car)', ' (SUV)', ' (minivan)', ' (pickup truck)', ' (crossover)'];
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const fileName = (s) => s.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 80);
const yearsIn = (s) => [...String(s).matchAll(/\b(19[4-9]\d|20[0-4]\d)\b/g)].map((x) => Number(x[1]));
/** "Golf/GTI" → GOLF, "CR-V" → CRV, "Model 3" → MODEL3: the part of the name an article or photo caption must contain */
const modelToken = (model) => {
  const first = norm(model.split(/[\s/]/)[0]);
  return first.length >= 3 && !/^(MODEL|GRAND|SERIES|NEW)$/.test(first) ? first : norm(model).slice(0, 12);
};

async function summary(title) {
  const s = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  await sleep(150);
  return s;
}

/** Production that ended before our first model year ("Car model (1962–1978)", "…was produced from 1967 to 1972.") */
function oldCar(desc, extract, firstYear) {
  // only the short description and first sentence: later sentences mention predecessors ("replaced the Bronco (1966–1996)")
  const t = `${desc}. ${String(extract).split(/\.\s/)[0]}`;
  if (/\b(present|current|ongoing|since)\b/i.test(t)) return false;
  const ranges = [...t.matchAll(/\b(19\d\d|20[0-4]\d)\s*(?:–|-|—|to|until|and)\s*(19\d\d|20[0-4]\d)\b/g)].map((x) => Number(x[2]));
  return ranges.length > 0 && Math.max(...ranges) < firstYear;
}

/** Is this summary a real article about this car (not an index page, not an ATV, not a much older namesake)? */
function isCarArticle(s, model, firstYear) {
  if (!s?.extract || s.type === 'disambiguation') return false;
  const desc = `${s.description ?? ''}`;
  if (/index of articles|may refer to|disambiguation|topics referred to/i.test(desc) || /can refer to|may refer to/i.test(s.extract.slice(0, 160))) return false;
  if (NOT_CAR.test(desc)) return false;
  if (oldCar(desc, s.extract, firstYear) || oldCar(s.title ?? '', '', firstYear)) return false;
  // the article must mention the model name and describe a road vehicle somewhere near the top
  const top = `${desc} ${s.extract.slice(0, 400)}`;
  return CARLIKE.test(top) && norm(top).includes(modelToken(model));
}

async function search(q) {
  const j = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=5&srsearch=${encodeURIComponent(q)}`);
  await sleep(150);
  return (j?.query?.search ?? []).map((x) => x.title);
}

/**
 * Commons photos among the article's images: lead image first, then files whose name dates them within our years
 * (newest first), then undated ones. Long articles list old generations first, so ranking comes before the cut.
 * JPEGs, plus PNGs that look like photos (a year or "front/side view" in the name) — other PNGs/SVGs are logos and maps.
 */
async function candidates(title, lead, { make, firstYear, lastYear }) {
  const m = String(lead ?? '').match(/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
  const leadFile = m ? decodeURIComponent(m[1]).replace(/ /g, '_') : undefined;
  const ml = await getJson(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, '_'))}`).catch(() => null);
  await sleep(150);
  const photo = (f) => /\.jpe?g$/i.test(f) || (/\.png$/i.test(f) && /\b(19|20)\d\d\b|front|side|view/i.test(f.replace(/_/g, ' ')));
  const all = [...new Set((ml?.items ?? []).filter((it) => it.type === 'image' && it.title).map((it) => it.title.replace(/^File:/, '').replace(/ /g, '_')))];
  const rest = all
    .filter((f) => f !== leadFile && photo(f) && !blocked(f))
    .map((f) => ({ f, ys: captionYears(f.replace(/_/g, ' '), make) }))
    .filter(({ ys }) => !ys.length || (Math.min(...ys) >= firstYear - 2 && Math.min(...ys) <= lastYear + 2))
    .sort((a, b) => (b.ys.length ? Math.min(...b.ys) : 0) - (a.ys.length ? Math.min(...a.ys) : 0))
    .map(({ f }) => f);
  const files = [...(leadFile && photo(leadFile) && !blocked(leadFile) ? [leadFile] : []), ...rest].slice(0, 49);
  return { files, leadFile };
}

/** Year of the car in a caption or file name: "2002 Honda Integra", "'60 Chevrolet Impala", "94-95 Mercedes-Benz E-Class" */
function captionYears(named, make) {
  const ys = yearsIn(named);
  const short = named.match(new RegExp(`(?:^|[^\\d])'?(\\d{2})(?:-\\d{2})? ${make.split(/[\s-]/)[0]}`, 'i'));
  if (short) ys.push(Number(short[1]) > 40 ? 1900 + Number(short[1]) : 2000 + Number(short[1]));
  return ys;
}

/** Free, plausible photo of this model from the article, or undefined. Lead image first, then the newest fitting year. */
async function photoFor(title, lead, extract, { key, make, model, firstYear, lastYear }) {
  if (NO_PHOTO.has(key)) return undefined;
  // a recent nameplate on an article with a long history ("Honda Prelude" since 1978): undated images are likely older generations
  const revived = firstYear >= 2015 && yearsIn(extract).some((y) => y < firstYear - 10);
  const { files, leadFile } = await candidates(title, lead, { make, firstYear, lastYear });
  if (!files.length) return undefined;
  await sleep(1000); // Commons is stricter than the Wikipedia REST API
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800&titles=${encodeURIComponent(files.map((f) => 'File:' + f).join('|'))}`);
  const info = new Map(Object.values(j?.query?.pages ?? {}).map((p) => [p.title.replace(/^File:/, '').replace(/ /g, '_'), p.imageinfo?.[0]]));
  const ok = [];
  files.forEach((file) => {
    const ii = info.get(file);
    const md = ii?.extmetadata ?? {};
    const lic = strip(md.LicenseShortName?.value);
    if (!ii?.thumburl || !FREE.test(lic) || ii.thumbwidth < 400 || ii.thumbheight > ii.thumbwidth) return;
    const caption = strip(md.ObjectName?.value) || file.replace(/\.[a-z]+$/i, '').replace(/_/g, ' ');
    const named = `${caption} ${file.replace(/_/g, ' ')}`;
    const text = `${named} ${strip(md.ImageDescription?.value).slice(0, 300)}`;
    if (NOT_CAR.test(text) || NOT_PHOTO.test(named)) return;
    // the caption/file should name the model (catches images of a different car) — except the lead image of the
    // already-verified article, whose captions often use chassis codes instead ("BMW G20" for the 3 Series)
    const isLead = file === leadFile;
    if (!isLead && !norm(text).includes(modelToken(model))) return;
    // year of the car in the caption or file name, else any year in the description
    const named_y = captionYears(named, make);
    const year = named_y.length ? Math.min(...named_y) : undefined;
    if (year && (year < firstYear - 2 || year > lastYear + 2)) return;
    if (!year) {
      const ys = yearsIn(text);
      if (ys.length && Math.max(...ys) < firstYear - 12) return;
    }
    ok.push({ ii, md, lic, caption, year, lead: isLead });
  });
  if (revived) ok.splice(0, ok.length, ...ok.filter((x) => x.year));
  if (!ok.length) return undefined;
  // a photo dated within our years beats an undated lead image (undated leads are often an older generation)
  const dated = ok.filter((x) => x.year).sort((a, b) => b.lead - a.lead || b.year - a.year)[0];
  const pick = dated ?? ok.find((x) => x.lead) ?? ok[0];
  const local = `${fileName(key)}.${/\.png$/i.test(pick.ii.thumburl) ? 'png' : 'jpg'}`;
  const res = await fetch(pick.ii.thumburl, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return undefined;
  await writeFile(PHOTO_DIR + local, Buffer.from(await res.arrayBuffer()));
  return {
    file: local,
    w: pick.ii.thumbwidth,
    h: pick.ii.thumbheight,
    caption: pick.caption,
    artist: strip(pick.md.Artist?.value).slice(0, 80) || 'Unknown author',
    license: pick.lic,
    licenseUrl: pick.md.LicenseUrl?.value,
    page: pick.ii.descriptionurl,
  };
}

/**
 * models: [{ key, make, model, firstYear, lastYear }]. Chooses + validates a title per model, fetches overview and photo.
 * Returns { titles: { key: title|null }, wiki: { title: { extract, url }, '#key': { title, photo? } } }
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
    // "Golf/GTI" → also "Golf"; "500 L" → also "500L"
    const names = [...new Set([m.model, m.model.split('/')[0].trim(), m.model.replace(/\s+/g, '')])];
    const tried = new Set();
    const tryTitle = async (t) => {
      if (tried.has(t)) return false;
      tried.add(t);
      const s = await summary(t).catch(() => null);
      calls++;
      for (const name of names) if (isCarArticle(s, name, m.firstYear)) return (found = s);
      return false;
    };
    search: {
      for (const name of names) for (const suf of SUFFIXES) if (await tryTitle(`${m.make} ${name}${suf}`)) break search;
      rejected++;
      // search hits must be named exactly like the model, apart from a "(…)" qualifier: not "Ford Excursion", "Bronco Sport"
      const exact = new Set(names.map((n) => norm(`${m.make} ${n}`)));
      const hits = await search(`${m.make} ${names[0]} car`).catch(() => []);
      calls++;
      for (const t of hits) if (exact.has(norm(t.replace(/\s*\(.*\)\s*$/, ''))) && (await tryTitle(t))) break search;
    }
    const title = found?.title ?? null;
    titles[m.key] = title;
    const own = { v: VERSION, at: today(), title };
    // a photo already chosen (and reviewed) for this article stays, unless it was blocklisted since
    const kept = prev?.photo && prev.title === title && !NO_PHOTO.has(m.key) && !blocked(decodeURIComponent(prev.photo.page?.split('File:')[1] ?? '')) && existsSync(PHOTO_DIR + prev.photo.file) ? prev.photo : undefined;
    if (found) {
      if (!fresh(cache[title]))
        cache[title] = { v: VERSION, at: today(), extract: found.extract.length > 700 ? found.extract.slice(0, found.extract.lastIndexOf('. ', 700) + 1) : found.extract, url: found.content_urls?.desktop?.page };
      if (kept) own.photo = kept;
      else try {
        own.photo = await photoFor(title, found.originalimage?.source ?? found.thumbnail?.source, found.extract, m);
        calls += 2;
      } catch (e) {
        log(`  photo ${title}: ${e.message}`);
      }
      if (own.photo) photos++;
    }
    cache[`#${m.key}`] = own;
    if (checked % 100 === 0) {
      await writeJson(FILE, cache);
      await writeJson(TITLES, titles);
    }
  }
  await writeJson(FILE, cache);
  await writeJson(TITLES, titles);
  const left = models.filter((m) => !fresh(cache[`#${m.key}`])).length;
  log(`Wikipedia: ${checked} models checked (${rejected} needed a search beyond the plain titles), ${photos} photos, ${left} left`);
  return { titles, wiki: cache };
}
