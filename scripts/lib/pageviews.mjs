// Popularity from English Wikipedia article pageviews (Wikimedia Analytics API, data is CC0).
// Requires an identifying User-Agent (see http.mjs). Only titles and counts are used.
// Article titles come from wiki.mjs, which verifies each one is really about the car (not an index page).
// Daily views for the last 60 days per article → 30-day total and week-over-week change.
import { CACHE, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const VIEWS = CACHE + 'pageviews.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

/** models: [{ key }], titles: { key: verified article title|null }. Returns { [key]: { title, views30, week, prevWeek, series, shared? } } */
export async function collectPageviews(models, titles, { log }) {
  const end = new Date(Date.now() - 86400e3);
  const start = new Date(end.getTime() - 59 * 86400e3);
  const out = {};
  // several models can share one article (e.g. RAV4 and RAV4 Prime)
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
  log(`Wikipedia pageviews: ${ok} articles for ${Object.keys(out).length} models`);
  return out;
}
