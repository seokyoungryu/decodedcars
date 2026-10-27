// Daily: download/refresh every source → data/site. Run by .github/workflows/daily.yml.
//   node scripts/collect.mjs                  everything
//   node scripts/collect.mjs --ratings=300    cap NHTSA safety-rating API calls this run (default 2500)
//   node scripts/collect.mjs --skip=pageviews skip a slow step while testing (comma list)
// A failing source does not stop the run; the site is built from what we have and the job is marked failed.
import { readJson } from './lib/store.mjs';
import { CACHE, daysAgo } from './lib/store.mjs';
import { collectEpa } from './lib/epa.mjs';
import { collectComplaints, collectRecalls, nhtsaNames } from './lib/nhtsa-files.mjs';
import { collectRatings } from './lib/ratings.mjs';
import { collectPageviews } from './lib/pageviews.mjs';
import { collectSiteViews } from './lib/analytics.mjs';
import { aggregate, resolver } from './lib/aggregate.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const skip = new Set((args.skip ?? '').split(',').filter(Boolean));
const log = (...a) => console.log(...a);
const failed = [];
async function step(name, fn, fallback) {
  if (skip.has(name)) return fallback;
  const t = Date.now();
  try {
    return await fn();
  } catch (e) {
    failed.push(name);
    log(`✗ ${name}: ${e.stack ?? e.message}`);
    return fallback;
  } finally {
    log(`  (${name} ${((Date.now() - t) / 1000).toFixed(0)}s)`);
  }
}

const epa = await step('epa', () => collectEpa(log));
if (!epa) {
  log('EPA data is required for the model list. Stopping.');
  process.exit(1);
}
const recalls = await step('recalls', () => collectRecalls(log), { byModelYear: new Map(), campaigns: {} });
const complaints = await step('complaints', () => collectComplaints(log, daysAgo(90)), { stats: new Map(), recent: new Map() });

// Safety ratings use NHTSA spellings: find one NHTSA name per EPA model
const resolve = resolver(epa);
const nhtsaFor = new Map();
for (const [k, n] of nhtsaNames) {
  const ek = resolve(k);
  if (ek && !nhtsaFor.has(ek)) nhtsaFor.set(ek, n);
}
const jobs = [...epa.values()].flatMap((m) => Object.keys(m.years).map((y) => ({ key: m.key, year: Number(y), make: nhtsaFor.get(m.key)?.make ?? m.make, model: nhtsaFor.get(m.key)?.model ?? m.model })));
const ratings = await step('ratings', () => collectRatings(jobs, { budget: Number(args.ratings ?? 2500), log }), await readJson(CACHE + 'ratings.json', {}));

const recentModels = [...epa.values()].filter((m) => Object.keys(m.years).some((y) => Number(y) >= new Date().getUTCFullYear() - 12));
const views = await step('pageviews', () => collectPageviews(recentModels.map((m) => ({ key: m.key, make: m.make, model: m.model })), { log }), await readJson(CACHE + 'pageviews.json', {}));
const siteViews = await step('analytics', () => collectSiteViews(log), {});

await step('aggregate', () => aggregate({ epa, recalls, complaints, ratings, views, siteViews, nhtsaFor, log }));
if (failed.length) {
  log('Failed:', failed.join(', '));
  process.exit(1);
}
