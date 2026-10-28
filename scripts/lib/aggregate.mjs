// Join EPA (universe + specs), NHTSA recalls/complaints/ratings, Wikipedia popularity, site analytics
// → data/site/*. Pages must add value beyond the raw government data (Google scaled-content and
// AdSense low-value-content policies), so we compute comparisons: vs class average MPG, vs other
// model years, complaint rates by component, trends, rankings. Thin model-years are noindexed.
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PHOTO_DIR } from './wiki.mjs';
import { buildBuyerData, verdict, yearBody } from './buyer.mjs';
import { summarizeSpecs } from './specs.mjs';
import { SITE, daysAgo, today, writeJson } from './store.mjs';
import { norm, slug } from './keys.mjs';

// EPA classes are by size only; compare mainstream with mainstream and luxury with luxury first
const LUXURY = new Set(['ACURA', 'ALFAROMEO', 'ASTONMARTIN', 'AUDI', 'BENTLEY', 'BMW', 'BMWALPINA', 'BUGATTI', 'CADILLAC', 'FERRARI', 'GENESIS', 'INFINITI', 'JAGUAR', 'LAMBORGHINI', 'LANDROVER', 'LEXUS', 'LINCOLN', 'LOTUS', 'LUCID', 'MASERATI', 'MCLARENAUTOMOTIVE', 'MERCEDESBENZ', 'POLESTAR', 'PORSCHE', 'ROLLSROYCE', 'ROLLSROYCEMOTORCARSLTD', 'TESLA', 'VOLVO']);
const EXOTIC = new Set(['ASTONMARTIN', 'BENTLEY', 'BUGATTI', 'FERRARI', 'LAMBORGHINI', 'LOTUS', 'MCLARENAUTOMOTIVE', 'ROLLSROYCE', 'ROLLSROYCEMOTORCARSLTD']);
const tier = (key) => (EXOTIC.has(key.split('|')[0]) ? 2 : LUXURY.has(key.split('|')[0]) ? 1 : 0);
// EPA size classes in order, used when exterior length is unknown
const SIZE = (cls = '') => (/minicompact/i.test(cls) ? 0 : /subcompact|small/i.test(cls) ? 1 : /compact/i.test(cls) ? 2 : /midsize/i.test(cls) ? 3 : /large|standard/i.test(cls) ? 4 : 2);
const lengthOf = (y) => y.dims?.find((d) => d.length)?.length;
const maxCyl = (y) => Math.max(0, ...y.variants.filter((v) => v.type !== 'EV').map((v) => v.cyl ?? 0));
/** Are these two model years real rivals? Same body style and market tier, similar size and engine class. */
function rivals(a, b) {
  if (yearBody(a.y) !== yearBody(b.y) || tier(a.m.key) !== tier(b.m.key)) return false;
  const la = lengthOf(a.y), lb = lengthOf(b.y);
  if (la && lb ? Math.abs(la - lb) > 10 : SIZE(a.y.cls) !== SIZE(b.y.cls)) return false;
  const ca = maxCyl(a.y), cb = maxCyl(b.y);
  return !(ca && cb && Math.abs(ca - cb) >= 4);
}
const NOT_GAS = new Set(['EV', 'FCV']); // MPGe, not comparable with gasoline MPG
const MAX_YEAR_PAGES = 15000; // Cloudflare Pages free plan: 20k files total
const ES_YEAR_PAGES = 5000; // Spanish model-year pages: the most useful indexable ones (file budget shared with English)
const median = (a) => {
  if (!a.length) return undefined;
  const s = [...a].sort((x, y) => x - y);
  return s[s.length >> 1];
};
const round1 = (x) => Math.round(x * 10) / 10;

/** NHTSA key → EPA key: exact, else longest EPA model the NHTSA name starts with ("SILVERADO1500" → "SILVERADO"), else the reverse */
export function resolver(epaModels) {
  const byMake = new Map();
  for (const k of epaModels.keys()) {
    const [mk, md] = k.split('|');
    (byMake.get(mk) ?? byMake.set(mk, []).get(mk)).push(md);
  }
  for (const list of byMake.values()) list.sort((a, b) => b.length - a.length);
  const memo = new Map();
  return (k) => {
    if (memo.has(k)) return memo.get(k);
    let out = epaModels.has(k) ? k : null;
    if (!out) {
      const [mk, md] = k.split('|');
      const list = byMake.get(mk) ?? [];
      const hit = list.find((e) => e.length >= 2 && md.startsWith(e)) ?? (md.length >= 3 ? list.find((e) => e.startsWith(md)) : undefined);
      out = hit ? `${mk}|${hit}` : null;
    }
    memo.set(k, out);
    return out;
  };
}

/** EPA "F150" + NHTSA "F-150" → "F-150": NHTSA punctuation, EPA letter case (keeps "CR-V", not "Cr-V") */
export function displayName(epaName, nhtsaName) {
  if (!nhtsaName || norm(nhtsaName) !== norm(epaName) || nhtsaName.length <= epaName.length) return epaName;
  const letters = epaName.replace(/[^A-Za-z0-9]/g, '');
  let i = 0;
  return nhtsaName.replace(/[A-Za-z0-9]/g, () => letters[i++]);
}

/** Wikipedia overview + free photo for a model (via its resolved article title) */
let wikiCtx = { wiki: {}, titles: {}, es: {} };
function wikiFor(key) {
  const t = wikiCtx.titles[key];
  const w = t && wikiCtx.wiki[t];
  if (!w?.extract) return {};
  // the photo is chosen per model (an article can cover several models and generations)
  const e = wikiCtx.es[t];
  return { overview: { title: t, text: w.extract, url: w.url }, ...(e && { overviewEs: { title: e.title, text: e.extract, url: e.url } }), photo: wikiCtx.wiki[`#${key}`]?.photo };
}

export async function aggregate({ epa, recalls, complaints, ratings, views, siteViews, nhtsaFor = new Map(), cvs = {}, wiki = {}, titles = {}, vinspecs = {}, wikiEs = {}, log }) {
  rmSync(SITE, { recursive: true, force: true });
  wikiCtx = { wiki, titles, es: wikiEs };
  const resolve = resolver(epa);
  const nowYear = new Date().getUTCFullYear();

  // Transport Canada dimensions: each CVS body ("CIVIC 5DR HATCH") goes to the EPA model with the longest name it starts with
  const epaByMake = new Map();
  for (const k of epa.keys()) {
    const [mk, md] = k.split('|');
    (epaByMake.get(mk) ?? epaByMake.set(mk, []).get(mk)).push(md);
  }
  for (const l of epaByMake.values()) l.sort((x, y) => y.length - x.length);
  const dimsBy = new Map(); // 'epaKey|year' → [{ name, length, … }]
  for (const [mkYear, entry] of Object.entries(cvs)) {
    const [mkRaw, year] = mkYear.split('|');
    const mk = norm(mkRaw) === 'MERCEDESBENZ' ? 'MERCEDESBENZ' : norm(mkRaw);
    for (const d of entry.models ?? []) {
      const n = norm(d.name);
      const hit = (epaByMake.get(mk) ?? []).find((e) => e.length >= 2 && n.startsWith(e));
      if (!hit) continue;
      const k = `${mk}|${hit}|${year}`;
      const list = dimsBy.get(k) ?? dimsBy.set(k, []).get(k);
      if (!list.some((x) => x.name === d.name)) list.push(d);
    }
  }

  // NHTSA → EPA mapping, merged per model-year
  const recallsBy = new Map(); // epaKey → Map<year, Set<camp>>
  for (const [k, byYear] of recalls.byModelYear) {
    const ek = resolve(k);
    if (!ek) continue;
    const t = recallsBy.get(ek) ?? recallsBy.set(ek, new Map()).get(ek);
    for (const [y, set] of byYear) for (const c of set) (t.get(y) ?? t.set(y, new Set()).get(y)).add(c);
  }
  const complaintsBy = new Map();
  const recent90 = new Map();
  for (const [k, byYear] of complaints.stats) {
    const ek = resolve(k);
    if (!ek) continue;
    const t = complaintsBy.get(ek) ?? complaintsBy.set(ek, new Map()).get(ek);
    for (const [y, s] of byYear) {
      const cur = t.get(y);
      if (!cur) t.set(y, s);
      else {
        for (const id of s.ids) cur.ids.add(id);
        for (const f of ['crash', 'fire', 'injured', 'deaths']) cur[f] += s[f];
        for (const [c, n] of Object.entries(s.comps)) cur.comps[c] = (cur.comps[c] ?? 0) + n;
        for (const [m, n] of Object.entries(s.months)) cur.months[m] = (cur.months[m] ?? 0) + n;
        cur.miles.push(...s.miles);
      }
    }
    if (complaints.recent.has(k)) recent90.set(ek, (recent90.get(ek) ?? 0) + complaints.recent.get(k));
  }

  // Class average combined MPG per (EPA class, year), gasoline/hybrid only (EVs would skew it)
  const classAvg = new Map();
  for (const m of epa.values())
    for (const [y, yr] of Object.entries(m.years))
      for (const v of yr.variants)
        if (v.comb && !NOT_GAS.has(v.type)) {
          const k = `${v.cls}|${y}`;
          const a = classAvg.get(k) ?? classAvg.set(k, []).get(k);
          a.push(v.comb);
        }
  const avgOf = (cls, y) => {
    const a = classAvg.get(`${cls}|${y}`);
    return a && a.length >= 5 ? round1(a.reduce((s, x) => s + x, 0) / a.length) : undefined;
  };

  const usedCamps = new Set();
  const modelsOut = [];
  const yearPages = [];
  for (const m of epa.values()) {
    const years = [];
    for (const [yStr, yr] of Object.entries(m.years).sort((a, b) => b[0] - a[0])) {
      const y = Number(yStr);
      const camps = [...(recallsBy.get(m.key)?.get(y) ?? [])].map((c) => recalls.campaigns[c]).filter(Boolean).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
      camps.forEach((c) => usedCamps.add(c.id));
      const cs = complaintsBy.get(m.key)?.get(y);
      const rating = ratings[`${m.key}|${y}`]?.variants?.filter((v) => v.overall || v.front || v.side || v.rollover) ?? [];
      const variants = yr.variants
        .sort((a, b) => (b.comb ?? 0) - (a.comb ?? 0))
        .map(({ id, added, ...v }) => ({ ...v, vsClass: v.comb && !NOT_GAS.has(v.type) && avgOf(v.cls, y) ? Math.round((v.comb / avgOf(v.cls, y) - 1) * 100) : undefined }));
      const gas = variants.filter((v) => v.comb && !NOT_GAS.has(v.type));
      const ev = variants.filter((v) => v.type === 'EV' && v.range);
      const complaintsCount = cs?.ids.size ?? 0;
      const topComps = cs ? Object.entries(cs.comps).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
      const dims = (dimsBy.get(`${m.key}|${y}`) ?? []).slice(0, 6);
      const rich = camps.length > 0 || complaintsCount >= 3 || rating.length > 0 || dims.length > 0;
      const pickMax = (f) => (variants.some((v) => v[f]) ? Math.max(...variants.filter((v) => v[f]).map((v) => v[f])) : undefined);
      const pickMin = (f) => (variants.some((v) => v[f]) ? Math.min(...variants.filter((v) => v[f]).map((v) => v[f])) : undefined);
      years.push({
        year: y,
        cls: variants[0]?.cls,
        variants,
        mpg: gas.length ? { min: Math.min(...gas.map((v) => v.comb)), max: Math.max(...gas.map((v) => v.comb)), city: Math.max(...gas.map((v) => v.city ?? 0)), hwy: Math.max(...gas.map((v) => v.hwy ?? 0)) } : undefined,
        range: ev.length ? Math.max(...ev.map((v) => v.range)) : undefined,
        cost: variants.some((v) => v.cost) ? Math.min(...variants.filter((v) => v.cost).map((v) => v.cost)) : undefined,
        classAvg: variants[0] && avgOf(variants[0].cls, y),
        dims,
        drives: [...new Set(variants.map((v) => v.drive).filter(Boolean))],
        fuels: [...new Set(variants.map((v) => v.type ?? v.fuel).filter(Boolean))],
        engines: [...new Set(variants.filter((v) => v.displ).map((v) => `${v.displ.toFixed(1)}L ${v.cyl ? `${v.cyl}-cyl` : ''}${v.turbo ? ' turbo' : ''}`.trim()))],
        charge: pickMin('charge'),
        co2: pickMin('co2'),
        feScore: pickMax('feScore'),
        ghgScore: pickMax('ghgScore'),
        save5: pickMax('save5'),
        recalls: camps.map((c) => c.id),
        complaints: cs
          ? { total: complaintsCount, crash: cs.crash, fire: cs.fire, injured: cs.injured, deaths: cs.deaths, comps: topComps, miles: median(cs.miles), months: cs.months }
          : { total: 0, comps: [] },
        rating: rating.length ? rating : undefined,
        overall: rating.length ? Math.max(...rating.map((v) => v.overall ?? 0)) || undefined : undefined,
        added: yr.variants.map((v) => v.added).filter(Boolean).sort()[0],
        rich,
      });
    }
    const pv = views[m.key];
    const shown = displayName(m.model, nhtsaFor.get(m.key)?.model);
    const model = {
      key: m.key,
      make: m.make,
      model: shown,
      makeSlug: m.makeSlug,
      slug: slug(shown),
      years,
      popularity: pv && { title: pv.title, views30: pv.views30, week: pv.week, prevWeek: pv.prevWeek, change: pv.prevWeek ? Math.round((pv.week / pv.prevWeek - 1) * 100) : undefined, series: pv.series, shared: pv.shared },
      recent90: recent90.get(m.key) ?? 0,
      siteViews: siteViews[`/${m.makeSlug}/${slug(shown)}`] ?? 0,
      ...wikiFor(m.key),
    };
    modelsOut.push(model);
    for (const y of years) yearPages.push({ m: model, y, score: (y.rich ? 1e6 : 0) + y.recalls.length * 50 + y.complaints.total + (pv?.views30 ?? 0) / 100 });
  }

  // Page budget: keep the most useful model-year pages
  yearPages.sort((a, b) => b.score - a.score);
  const kept = new Set(yearPages.slice(0, MAX_YEAR_PAGES).map((p) => `${p.m.key}|${p.y.year}`));
  const noindex = [];
  for (const p of yearPages) {
    p.y.page = kept.has(`${p.m.key}|${p.y.year}`);
    if (p.y.page && !p.y.rich) noindex.push(`/${p.m.makeSlug}/${p.m.slug}/${p.y.year}`);
  }
  let esCount = 0;
  for (const p of yearPages) if (p.y.page && p.y.rich && esCount < ES_YEAR_PAGES) (p.y.es = true), esCount++;

  // Slug collisions (two EPA base models that slugify the same) → keep the one with more data
  const seen = new Map();
  for (const m of modelsOut.sort((a, b) => b.years.length - a.years.length)) {
    const s = `${m.makeSlug}/${m.slug}`;
    if (seen.has(s)) m.skip = true;
    else seen.set(s, m);
  }
  const live = modelsOut.filter((m) => !m.skip && m.years.some((y) => y.page));

  // "Similar cars": same model year, body style and tier, similar length and engine class; most-researched first
  // (EPA size classes alone go by interior volume, so a Civic sedan is "midsize" and a Corolla "compact")
  const byBodyYear = new Map();
  for (const m of live)
    for (const y of m.years)
      if (y.cls && y.page) (byBodyYear.get(`${yearBody(y)}|${y.year}`) ?? byBodyYear.set(`${yearBody(y)}|${y.year}`, []).get(`${yearBody(y)}|${y.year}`)).push({ m, y });
  for (const m of live) for (const y of m.years) y.specs = summarizeSpecs(vinspecs[`${m.key}|${y.year}`]);
  const mid = (a) => {
    const v = a.filter((x) => x != null && !Number.isNaN(x)).sort((p, q) => p - q);
    return v.length ? v[Math.floor(v.length / 2)] : undefined;
  };
  for (const list of byBodyYear.values()) {
    list.sort((p, q) => (q.m.popularity?.views30 ?? 0) - (p.m.popularity?.views30 ?? 0) || q.y.complaints.total - p.y.complaints.total);
    // rival medians for the data-based pros & cons (same year, body, tier and size as the "similar cars")
    for (const a of list) {
      const peers = list.filter((p) => p.m !== a.m && rivals(a, p));
      if (peers.length >= 3)
        a.y.peer = {
          n: peers.length,
          mpg: mid(peers.map((p) => p.y.mpg?.max)),
          complaints: mid(peers.map((p) => p.y.complaints.total)),
          recalls: mid(peers.map((p) => p.y.recalls.length)),
          hp: mid(peers.map((p) => p.y.specs?.hp?.[1])),
        };
    }
    for (const a of list)
      a.y.similar = list
        .filter((p) => p.m !== a.m && p.m.make + p.m.model !== a.m.make + a.m.model && rivals(a, p))
        .slice(0, 6)
        .map((p) => ({ make: p.m.make, model: p.m.model, makeSlug: p.m.makeSlug, slug: p.m.slug, year: p.y.year, es: p.y.es, mpg: p.y.mpg?.max, range: p.y.range, overall: p.y.overall, recalls: p.y.recalls.length }));
  }


  // A model page is thin when it can't say more than its year pages: no data-rich year, a single model year,
  // or two years and no overview. Thin model pages are noindex (their year pages stay indexed).
  for (const m of live) {
    const ys = m.years.filter((y) => y.page);
    if (!ys.some((y) => y.rich) || ys.length === 1 || (ys.length <= 2 && (!m.overview || !ys.some((y) => (y.similar?.length ?? 0) >= 3)))) m.thin = true;
  }
  for (const m of live) m.verdict = verdict(m);
  for (const m of live) await writeJson(`${SITE}models/${m.makeSlug}/${m.slug}.json`, m);
  await buildBuyerData(live, log);

  // Photos → public/photos (served as static files; attribution is stored with each model)
  const PUBLIC_PHOTOS = fileURLToPath(new URL('../../public/photos/', import.meta.url));
  rmSync(PUBLIC_PHOTOS, { recursive: true, force: true });
  mkdirSync(PUBLIC_PHOTOS, { recursive: true });
  let photoCount = 0;
  for (const m of live)
    if (m.photo && existsSync(PHOTO_DIR + m.photo.file) && !existsSync(PUBLIC_PHOTOS + m.photo.file)) {
      copyFileSync(PHOTO_DIR + m.photo.file, PUBLIC_PHOTOS + m.photo.file);
      photoCount++;
    }
  const campaigns = Object.fromEntries([...usedCamps].map((id) => [id, recalls.campaigns[id]]));
  await writeJson(SITE + 'campaigns.json', campaigns);

  // Make index
  const makes = new Map();
  for (const m of live) {
    const mk = makes.get(m.makeSlug) ?? makes.set(m.makeSlug, { slug: m.makeSlug, name: m.make, models: [] }).get(m.makeSlug);
    const ys = m.years.filter((y) => y.page);
    mk.models.push({
      slug: m.slug,
      name: m.model,
      from: Math.min(...ys.map((y) => y.year)),
      to: Math.max(...ys.map((y) => y.year)),
      recalls: new Set(m.years.flatMap((y) => y.recalls)).size,
      complaints: m.years.reduce((s, y) => s + y.complaints.total, 0),
      mpg: ys[0]?.mpg?.max,
      range: ys[0]?.range,
      views30: m.popularity?.views30 ?? 0,
      photo: m.photo?.file,
      cls: ys[0]?.cls,
      ...(m.thin && { thin: true }),
    });
  }
  // a make page is thin with fewer than 4 models or fewer than 3 models that have their own indexable page
  const makeList = [...makes.values()].map((x) => ({ ...x, models: x.models.sort((a, b) => b.views30 - a.views30 || a.name.localeCompare(b.name)), ...((x.models.length < 4 || x.models.filter((m) => !m.thin).length < 3) && { thin: true }) })).sort((a, b) => a.name.localeCompare(b.name));
  await writeJson(SITE + 'makes.json', makeList);

  // Rankings
  const card = (m, extra = {}) => ({ make: m.make, model: m.model, makeSlug: m.makeSlug, slug: m.slug, latest: m.years.find((y) => y.page)?.year, photo: m.photo?.file, ...extra });
  const recentYears = (m) => m.years.some((y) => y.year >= nowYear - 8);
  const since45 = daysAgo(45);
  const recentRecalls = Object.values(campaigns)
    .filter((c) => c.date >= since45)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40)
    .map((c) => ({
      id: c.id,
      date: c.date,
      comp: c.comps[0],
      units: c.units,
      doNotDrive: c.doNotDrive,
      models: live.flatMap((m) => m.years.filter((y) => y.recalls.includes(c.id)).map((y) => ({ ...card(m), year: y.year }))).slice(0, 6),
    }))
    .filter((c) => c.models.length);
  const latestYear = Math.max(...live.flatMap((m) => m.years.map((y) => y.year)).filter((y) => y <= nowYear + 1));
  const forYear = (yr) => live.flatMap((m) => m.years.filter((y) => y.year === yr && y.page).map((y) => ({ m, y })));
  const pickYear = forYear(latestYear).length > 200 ? latestYear : latestYear - 1;

  const rankings = {
    trending: live.filter((m) => m.popularity?.change !== undefined && m.popularity.week >= 2000 && !m.popularity.shared && recentYears(m)).sort((a, b) => b.popularity.change - a.popularity.change).slice(0, 20).map((m) => card(m, { change: m.popularity.change, week: m.popularity.week })),
    // models sharing one Wikipedia article (RAV4 / RAV4 Prime) would repeat the same number: keep one per article
    popular: live
      .filter((m) => m.popularity?.views30 && recentYears(m))
      .sort((a, b) => b.popularity.views30 - a.popularity.views30 || a.model.length - b.model.length)
      .filter((m, i, arr) => arr.findIndex((x) => x.popularity.title === m.popularity.title) === i)
      .slice(0, 30).map((m) => card(m, { views30: m.popularity.views30 })),
    siteViews: live.filter((m) => m.siteViews).sort((a, b) => b.siteViews - a.siteViews).slice(0, 20).map((m) => card(m, { siteViews: m.siteViews })),
    recentRecalls,
    complaints90: live.filter((m) => m.recent90).sort((a, b) => b.recent90 - a.recent90).slice(0, 30).map((m) => card(m, { recent90: m.recent90 })),
    year: pickYear,
    bestMpg: forYear(pickYear).filter(({ y }) => y.mpg).sort((a, b) => b.y.mpg.max - a.y.mpg.max).slice(0, 30).map(({ m, y }) => card(m, { year: y.year, mpg: y.mpg.max, cls: y.cls })),
    longestRange: forYear(pickYear).filter(({ y }) => y.range).sort((a, b) => b.y.range - a.y.range).slice(0, 30).map(({ m, y }) => card(m, { year: y.year, range: y.range, cls: y.cls })),
    cheapestFuel: forYear(pickYear).filter(({ y }) => y.cost).sort((a, b) => a.y.cost - b.y.cost).slice(0, 30).map(({ m, y }) => card(m, { year: y.year, cost: y.cost, cls: y.cls })),
    safest: live.flatMap((m) => m.years.filter((y) => y.page && y.year >= pickYear - 2 && y.overall === 5).map((y) => card(m, { year: y.year, recalls: y.recalls.length }))).sort((a, b) => b.year - a.year || a.recalls - b.recalls).slice(0, 40),
    newModels: live.flatMap((m) => m.years.filter((y) => y.page && y.added && y.added >= daysAgo(90)).map((y) => card(m, { year: y.year, added: y.added, mpg: y.mpg?.max, range: y.range }))).sort((a, b) => b.added.localeCompare(a.added)).slice(0, 40),
  };
  await writeJson(SITE + 'rankings.json', rankings);
  // thin model and make pages (flags set above; the views mark them noindex too)
  for (const m of live) if (m.thin) noindex.push(`/${m.makeSlug}/${m.slug}`, `/es/${m.makeSlug}/${m.slug}`);
  for (const mk of makeList) if (mk.thin) noindex.push(`/${mk.slug}`, `/es/${mk.slug}`);
  await writeJson(SITE + 'noindex.json', noindex);
  await writeJson(SITE + 'meta.json', { updated: new Date().toISOString(), date: today(), models: live.length, yearPages: kept.size });
  log(`Aggregate: ${makeList.length} makes, ${live.length} models, ${kept.size} model-year pages (${noindex.length} noindex), ${usedCamps.size} recall campaigns, ${photoCount} photos`);
}
