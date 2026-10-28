// Spanish overview text for the Spanish pages: the Spanish Wikipedia article linked from the verified English article
// (interlanguage link), lead section only. Spanish Wikipedia text is CC BY-SA 4.0 — shown unmodified with link and license.
// Cached 30 days; one langlinks call per 50 titles, then one summary per article.
import { CACHE, readJson, today, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const FILE = CACHE + 'wiki-es.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CARLIKE = /\b(autom[oó]vil(es)?|veh[ií]culos?|coches?|autos?|SUV|todoterrenos?|camionetas?|pickups?|furgonetas?|monovol[uú]menes|deportivos?|sed[aá]n|crossover|modelos?)\b/i;
const fresh = (e) => e && Date.parse(today()) - Date.parse(e.at) < 30 * 86400e3;

/** enTitles: English article titles → returns { enTitle: { title, extract, url } } for those with a Spanish article */
export async function collectWikiEs(enTitles, { log }) {
  const cache = await readJson(FILE, {});
  const todo = [...new Set(enTitles)].filter((t) => !fresh(cache[t]));
  let found = 0;
  let failed = 0;
  for (let i = 0; i < todo.length; i += 25) {
    const batch = todo.slice(i, i + 25);
    let j;
    try {
      j = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=langlinks&lllang=es&lllimit=max&titles=${encodeURIComponent(batch.join('|'))}`);
    } catch (e) {
      // skipped titles are retried on the next run
      if (++failed > 5) break;
      continue;
    }
    await sleep(300);
    // map normalized/redirected titles back to the titles we asked for
    const back = new Map(batch.map((t) => [t, t]));
    for (const n of [...(j?.query?.normalized ?? []), ...(j?.query?.redirects ?? [])]) back.set(n.to, back.get(n.from) ?? n.from);
    const es = new Map();
    for (const p of Object.values(j?.query?.pages ?? {})) {
      const ll = p.langlinks?.[0]?.['*'];
      if (ll) es.set(back.get(p.title) ?? p.title, ll);
    }
    for (const t of batch) {
      const esTitle = es.get(t);
      let entry = { at: today(), title: null };
      if (esTitle) {
        const s = await getJson(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(esTitle.replace(/ /g, '_'))}`).catch(() => null);
        await sleep(150);
        const top = `${s?.description ?? ''} ${s?.extract?.slice(0, 400) ?? ''}`;
        if (s?.extract && s.type !== 'disambiguation' && CARLIKE.test(top)) {
          const x = s.extract.length > 700 ? s.extract.slice(0, s.extract.lastIndexOf('. ', 700) + 1) : s.extract;
          entry = { at: today(), title: s.title, extract: x, url: s.content_urls?.desktop?.page };
          found++;
        }
      }
      cache[t] = entry;
    }
    await writeJson(FILE, cache);
  }
  await writeJson(FILE, cache);
  const out = {};
  for (const t of enTitles) if (cache[t]?.extract) out[t] = cache[t];
  log(`Spanish Wikipedia: ${todo.length} checked, ${found} new; ${Object.keys(out).length} models have a Spanish overview`);
  return out;
}
