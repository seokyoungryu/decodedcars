// Daily: download/refresh every source → data/site. Run by .github/workflows/daily.yml.
//   node scripts/collect.mjs                  everything
//   node scripts/collect.mjs --ratings=300    cap NHTSA safety-rating API calls this run (default 2500)
//   node scripts/collect.mjs --cvs=100 --wiki=100  cap dimension / Wikipedia calls (defaults 600 / 1500)
//   node scripts/collect.mjs --skip=pageviews skip a slow step while testing (comma list)
// A failing source does not stop the run; the site is built from what we have and the job is marked failed.
import { readJson } from './lib/store.mjs';
import { CACHE, daysAgo } from './lib/store.mjs';
import { collectEpa } from './lib/epa.mjs';
import { collectComplaints, collectRecalls, nhtsaNames } from './lib/nhtsa-files.mjs';
import { collectRatings } from './lib/ratings.mjs';
import { collectPageviews } from './lib/pageviews.mjs';
import { collectSiteViews } from './lib/analytics.mjs';
import { collectCvs } from './lib/cvs.mjs';
import { collectWiki } from './lib/wiki.mjs';
import { collectVinSpecs } from './lib/vinspecs.mjs';
import { aggregate, displayName, resolver } from './lib/aggregate.mjs';

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
const complaints = await step('complaints', () => collectComplaints(log, daysAgo(90)), { stats: new Map(), recent: new Map(), patterns: new Map() });

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

// Verified Wikipedia article per model (overview + free photo); popularity then uses the same verified titles
const wikiModels = recentModels.map((m) => ({ key: m.key, make: m.make, model: displayName(m.model, nhtsaFor.get(m.key)?.model), firstYear: Math.min(...Object.keys(m.years).map(Number)), lastYear: Math.max(...Object.keys(m.years).map(Number)) }));
const { titles, wiki } = await step('wiki', () => collectWiki(wikiModels, { budget: Number(args.wiki ?? 1500), log }), { titles: await readJson(CACHE + 'wiki-titles.json', {}), wiki: await readJson(CACHE + 'wiki.json', {}) });
const views = await step('pageviews', () => collectPageviews(recentModels.map((m) => ({ key: m.key })), titles, { log }), await readJson(CACHE + 'pageviews.json', {}));
const siteViews = await step('analytics', () => collectSiteViews(log), {});

// U.S. trims, horsepower and features: decode the most-reported VIN patterns of each model year (popular + recent first)
const patternsBy = new Map();
for (const [ky, pm] of complaints.patterns ?? []) {
  const [mk, md, year] = ky.split('|');
  const ek = resolve(`${mk}|${md}`);
  if (!ek) continue;
  const all = patternsBy.get(`${ek}|${year}`) ?? patternsBy.set(`${ek}|${year}`, new Map()).get(`${ek}|${year}`);
  for (const [p, c] of pm) all.set(p, (all.get(p) ?? 0) + c);
}
const nowY = new Date().getUTCFullYear();
const vinJobs = [...patternsBy]
  .map(([ky, pm]) => {
    const [mk, md, year] = ky.split('|');
    const key = `${mk}|${md}`;
    return { key, year: Number(year), patterns: [...pm].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p]) => p), pri: (views[key]?.views30 ?? 0) / (1 + Math.max(0, nowY - Number(year))) };
  })
  .sort((a, b) => b.pri - a.pri);
const vinspecs = await step('vinspecs', () => collectVinSpecs(vinJobs, { budget: Number(args.vin ?? 2500), log }), await collectVinSpecs(vinJobs, { budget: 0, log: () => {} }));

// Dimensions: one vPIC call per make + model year
const cvsJobs = [...new Set([...epa.values()].flatMap((m) => Object.keys(m.years).map((y) => `${m.make}|${y}`)))].map((s) => ({ make: s.split('|')[0], year: Number(s.split('|')[1]) }));
const cvs = await step('cvs', () => collectCvs(cvsJobs, { budget: Number(args.cvs ?? 600), log }), await readJson(CACHE + 'cvs.json', {}));


await step('aggregate', () => aggregate({ epa, recalls, complaints, ratings, views, siteViews, nhtsaFor, cvs, wiki, titles, vinspecs, log }));
if (failed.length) {
  log('Failed:', failed.join(', '));
  process.exit(1);
}
