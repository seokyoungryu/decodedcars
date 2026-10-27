// Popularity from English Wikipedia article pageviews (Wikimedia Analytics API, data is CC0).
// Requires an identifying User-Agent (see http.mjs). Article text is never used — only titles and counts.
//   1. Resolve "Make Model" → canonical article title once (MediaWiki API follows redirects), cache it.
//   2. Daily views for the last 60 days per article → 30-day total and week-over-week change.
import { CACHE, readJson, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const TITLES = CACHE + 'wiki-titles.json';
const VIEWS = CACHE + 'pageviews.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

/** models: [{ key, make, model }] (display names). Returns { [key]: { title, views30, week, prevWeek, series } } */
export async function collectPageviews(models, { log }) {
  const titles = await readJson(TITLES, {});

  // 1) title resolution, 50 candidates per request
  const missing = models.filter((m) => !(m.key in titles));
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    const cand = new Map(batch.map((m) => [`${m.make} ${m.model}`.replace(/\s+/g, ' ').trim(), m.key]));
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent([...cand.keys()].join('|'))}`;
    try {
      const j = await getJson(url);
      const norm = Object.fromEntries((j?.query?.normalized ?? []).map((x) => [x.from, x.to]));
      const redir = Object.fromEntries((j?.query?.redirects ?? []).map((x) => [x.from, x.to]));
      const exists = new Set(Object.values(j?.query?.pages ?? {}).filter((p) => !('missing' in p) && !('invalid' in p)).map((p) => p.title));
      for (const [t, k] of cand) {
        const n = norm[t] ?? t;
        const final = redir[n] ?? n;
        titles[k] = exists.has(final) ? final : null;
      }
    } catch (e) {
      log(`  wiki titles: ${e.message}`);
    }
    await sleep(300);
  }
  await writeJson(TITLES, titles);

  // 2) views (several models can share one article, e.g. a redirect to a model family page)
  const end = new Date(Date.now() - 86400e3);
  const start = new Date(end.getTime() - 59 * 86400e3);
  const out = {};
  const byTitle = new Map();
  for (const m of models) if (titles[m.key]) (byTitle.get(titles[m.key]) ?? byTitle.set(titles[m.key], []).get(titles[m.key])).push(m.key);
  let ok = 0;
  for (const [title, keys] of byTitle) {
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title.replace(/ /g, '_'))}/daily/${ymd(start)}/${ymd(end)}`;
    try {
      const j = await getJson(url);
      const series = (j?.items ?? []).map((x) => x.views);
      if (series.length) {
        const sum = (a) => a.reduce((s, v) => s + v, 0);
        const r = { title, views30: sum(series.slice(-30)), week: sum(series.slice(-7)), prevWeek: sum(series.slice(-14, -7)), series: series.slice(-60), shared: keys.length > 1 || undefined };
        for (const k of keys) out[k] = r;
        ok++;
      }
    } catch (e) {
      log(`  views ${title}: ${e.message}`);
    }
    await sleep(60);
  }
  await writeJson(VIEWS, out);
  log(`Wikipedia pageviews: ${ok} articles for ${Object.keys(out).length} models (${Object.values(titles).filter((t) => t === null).length} models without an article)`);
  return out;
}
