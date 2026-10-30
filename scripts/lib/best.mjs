// "Best by class" lists: current models ranked within their class on four public measures.
//   fuel     EPA yearly fuel/electricity cost of the most efficient version (lower is better)
//   safety   NHTSA overall stars of the newest rated year, up to 4 years back
//   recalls  recall campaigns per model year over the last 4 finished model years (lower is better)
//   tech     driver-assist features standard on every version (vPIC)
// Each measure becomes a percentile within the class; a missing measure counts as average (50) so thin data
// neither wins nor loses a list. Complaints are shown but not scored: they grow with sales volume.
import { SITE, writeJson } from './store.mjs';
import { tier } from './tiers.mjs';
import { yearBody } from './buyer.mjs';

const W = { fuel: 30, safety: 25, recalls: 30, tech: 15 };
const MIN = 6; // models needed for a list
const MAX = 20; // models shown per list
const nowYear = () => new Date().getUTCFullYear();

const size = (cls = '') => cls.replace(/\s*-?\s*(2WD|4WD|AWD)$/i, '').replace(/\s*-$/, '').trim();
const pw = (y) => {
  const f = y.fuels.join(' ');
  if (/\bEV\b/.test(f) && !/Hybrid|Gasoline|Diesel/.test(f)) return 'Electric';
  if (/Plug-in/.test(f)) return 'Plug-in hybrid';
  if (/Hybrid/.test(f)) return 'Hybrid';
  return 'Gas';
};

// the lists: who belongs in each; electric models have their own lists (they would top every fuel-cost column)
// (c = candidate with body, size class, tier, power)
const CLASSES = [
  { slug: 'small-suvs', title: 'Best small SUVs', noun: 'small SUV', test: (c) => c.pw !== 'Electric' && c.body === 'SUV' && /small/i.test(c.size) && c.tier === 0 },
  { slug: 'midsize-and-large-suvs', title: 'Best midsize & large SUVs', noun: 'midsize or large SUV', test: (c) => c.pw !== 'Electric' && c.body === 'SUV' && /standard/i.test(c.size) && c.tier === 0 },
  { slug: 'luxury-small-suvs', title: 'Best luxury small SUVs', noun: 'luxury small SUV', test: (c) => c.pw !== 'Electric' && c.body === 'SUV' && /small/i.test(c.size) && c.tier === 1 },
  { slug: 'luxury-large-suvs', title: 'Best luxury midsize & large SUVs', noun: 'luxury midsize or large SUV', test: (c) => c.pw !== 'Electric' && c.body === 'SUV' && /standard/i.test(c.size) && c.tier === 1 },
  { slug: 'pickup-trucks', title: 'Best pickup trucks', noun: 'pickup truck', test: (c) => c.pw !== 'Electric' && c.body === 'Pickup' },
  { slug: 'minivans', title: 'Best minivans', noun: 'minivan', min: 4, test: (c) => c.pw !== 'Electric' && c.body === 'Minivan' },
  { slug: 'small-cars', title: 'Best small cars', noun: 'compact or subcompact car', min: 5, test: (c) => c.pw !== 'Electric' && c.body === 'Car' && /compact/i.test(c.size) && c.tier === 0 },
  { slug: 'midsize-cars', title: 'Best midsize cars', noun: 'midsize car', test: (c) => c.pw !== 'Electric' && c.body === 'Car' && /midsize/i.test(c.size) && c.tier === 0 },
  { slug: 'large-cars', title: 'Best large cars', noun: 'large car', min: 5, test: (c) => c.pw !== 'Electric' && c.body === 'Car' && /large/i.test(c.size) && c.tier === 0 },
  { slug: 'luxury-cars', title: 'Best luxury cars', noun: 'luxury car', test: (c) => c.pw !== 'Electric' && (c.body === 'Car' || c.body === 'Wagon') && c.tier === 1 },
  { slug: 'sports-cars', title: 'Best sports cars', noun: 'sports car', test: (c) => c.pw !== 'Electric' && c.body === 'Sports / 2-seat' && c.tier < 2 },
  { slug: 'wagons', title: 'Best wagons & hatchbacks', noun: 'wagon or hatchback', min: 5, test: (c) => c.pw !== 'Electric' && c.body === 'Wagon' && c.tier === 0 },
  { slug: 'electric-suvs', title: 'Best electric SUVs', noun: 'electric SUV', test: (c) => c.body === 'SUV' && c.pw === 'Electric' && c.tier < 2 },
  { slug: 'electric-cars', title: 'Best electric cars', noun: 'electric car', test: (c) => c.body !== 'SUV' && c.body !== 'Pickup' && c.pw === 'Electric' && c.tier < 2 },
  { slug: 'hybrid-suvs', title: 'Best hybrid SUVs', noun: 'hybrid SUV', test: (c) => c.body === 'SUV' && (c.pw === 'Plug-in hybrid' || (c.pw === 'Hybrid' && c.mpg >= 35)) && c.tier < 2 },
  { slug: 'hybrid-cars', title: 'Best hybrid cars', noun: 'hybrid car', min: 5, test: (c) => c.body !== 'SUV' && c.body !== 'Pickup' && (c.pw === 'Plug-in hybrid' || (c.pw === 'Hybrid' && c.mpg >= 35)) && c.tier < 2 },
];

/** percentile (0–100) of v among vals; best gets 100 */
function pct(v, vals, low) {
  if (v == null || vals.length < 2) return undefined;
  const better = vals.filter((x) => (low ? x > v : x < v)).length;
  const same = vals.filter((x) => x === v).length - 1;
  return Math.round(((better + same / 2) / (vals.length - 1)) * 100);
}

export async function buildBest(live, log) {
  const now = nowYear();
  const cands = [];
  for (const m of live) {
    if (m.thin) continue;
    const y = m.years.find((x) => x.page && x.year <= now + 1);
    if (!y || y.year < now - 1) continue; // on sale now
    const rated = m.years.find((x) => x.overall && x.year <= y.year && x.year >= y.year - 4);
    const done = m.years.filter((x) => x.page && x.year < now && x.year >= Math.max(2015, now - 4));
    const specs = y.specs ?? m.years.find((x) => x.specs && Math.abs(x.year - y.year) <= 2)?.specs;
    const std = specs?.features ? Object.values(specs.features).filter((v) => v === 'std').length : undefined;
    cands.push({
      m, y,
      mpg: y.mpg?.max, body: yearBody(y), size: size(y.cls), tier: tier(m.key), pw: pw(y),
      // a model sold with gas and EV versions is scored on its cheapest non-EV version outside the EV lists
      fuel: pw(y) === 'Electric' ? y.cost : (y.variants.filter((v) => v.type !== 'EV' && v.cost).map((v) => v.cost).sort((p, q) => p - q)[0] ?? y.cost),
      safety: rated?.overall, safetyYear: rated?.year,
      recalls: done.length ? Math.round((done.reduce((s, x) => s + x.recalls.length, 0) / done.length) * 10) / 10 : undefined,
      complaints: done.length ? Math.round(done.reduce((s, x) => s + x.complaints.total, 0) / done.length) : undefined,
      tech: std || undefined,
    });
  }

  const classes = [];
  const byModel = {};
  for (const def of CLASSES) {
    const list = cands.filter(def.test).filter((c) => c.fuel != null);
    if (list.length < (def.min ?? MIN)) continue;
    const vals = (k) => list.map((c) => c[k]).filter((v) => v != null);
    const V = { fuel: vals('fuel'), safety: vals('safety'), recalls: vals('recalls'), tech: vals('tech') };
    const rows = list
      .map((c) => {
        const p = {
          fuel: pct(c.fuel, V.fuel, true),
          safety: pct(c.safety, V.safety, false),
          recalls: pct(c.recalls, V.recalls, true),
          tech: pct(c.tech, V.tech, false),
        };
        const score = Math.round(Object.entries(W).reduce((s, [k, w]) => s + w * (p[k] ?? 50), 0) / 100);
        return {
          make: c.m.make, model: c.m.model, makeSlug: c.m.makeSlug, slug: c.m.slug, year: c.y.year, photo: c.m.photo?.file,
          cls: c.y.cls, pw: c.pw, mpg: c.y.mpg?.max, range: c.y.range,
          fuel: c.fuel, safety: c.safety, safetyYear: c.safetyYear, recalls: c.recalls, complaints: c.complaints, tech: c.tech,
          p, score, views: c.m.popularity?.views30 ?? 0,
        };
      })
      .sort((a, b) => b.score - a.score || b.views - a.views)
      .slice(0, MAX);
    rows.forEach((r, i) => (byModel[`${r.makeSlug}/${r.slug}`] ??= []).push({ slug: def.slug, title: def.title, rank: i + 1, of: rows.length }));
    classes.push({ slug: def.slug, title: def.title, noun: def.noun, total: list.length, rows });
  }
  await writeJson(SITE + 'best.json', { classes, byModel });
  log?.(`Best lists: ${classes.length} classes (${classes.map((c) => `${c.slug} ${c.total}`).join(', ')})`);
}
