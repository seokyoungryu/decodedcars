// Buyer-focused data built from the joined models:
//   verdict    best / worst used model years per model (2015+, at least 2 years old)
//   vs pairs   head-to-head comparison pages for popular rivals (same EPA class, same tier)
//   finder     one row per model (latest model year) for the client-side car finder, VIN lookup and cost calculator
import { SITE, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const MAX_VS = 1500; // comparison pages (Cloudflare file budget)
const nowYear = () => new Date().getUTCFullYear();

/** Problem score per model year: complaints, plus recalls and severe outcomes weighted up */
const score = (y) => y.complaints.total + y.recalls.length * 20 + (y.complaints.crash ?? 0) * 3 + (y.complaints.fire ?? 0) * 10;

export function verdict(m) {
  // complaints are counted from 2015 on, and brand-new years have had no time to collect reports
  const ys = m.years.filter((y) => y.page && y.year >= 2015 && y.year <= nowYear() - 2);
  if (ys.length < 2) return undefined;
  const sorted = [...ys].sort((a, b) => score(a) - score(b) || b.year - a.year);
  const best = sorted[0];
  const worst = sorted.at(-1);
  const why = (y) => ({
    year: y.year,
    complaints: y.complaints.total,
    recalls: y.recalls.length,
    crash: y.complaints.crash ?? 0,
    fire: y.complaints.fire ?? 0,
    top: y.complaints.comps[0]?.[0],
    overall: y.overall,
  });
  // only call a year "worst" when it clearly stands out
  const clear = score(worst) >= Math.max(40, score(best) * 2);
  return { best: why(best), worst: clear ? why(worst) : undefined, compared: ys.length };
}

/** Body group for the finder from the EPA class */
export function body(cls = '') {
  if (/pickup/i.test(cls)) return 'Pickup';
  if (/minivan/i.test(cls)) return 'Minivan';
  if (/van/i.test(cls)) return 'Van';
  if (/sport utility/i.test(cls)) return 'SUV';
  if (/two seaters|minicompact/i.test(cls)) return 'Sports / 2-seat';
  if (/wagon/i.test(cls)) return 'Wagon';
  if (/car/i.test(cls)) return 'Car';
  return 'Other';
}
const BODY_ORDER = ['Pickup', 'Minivan', 'Van', 'SUV', 'Sports / 2-seat', 'Car', 'Wagon', 'Other'];
/** Body group of a model year from all its versions: EPA files some crossover versions (CR-V hybrid, HR-V 2WD) as "station wagons" */
export function yearBody(y) {
  const groups = new Set([y.cls, ...y.variants.map((v) => v.cls)].filter(Boolean).map((c) => body(c)));
  return BODY_ORDER.find((b) => groups.has(b)) ?? 'Other';
}
const power = (y) => {
  const f = y.fuels.join(' ');
  if (/^EV$|\bEV\b/.test(f) && !/Hybrid|Gasoline|Diesel/.test(f)) return 'Electric';
  if (/Plug-in/.test(f)) return 'Plug-in hybrid';
  if (/Hybrid/.test(f)) return 'Hybrid';
  if (/Diesel/.test(f)) return 'Diesel';
  if (/EV/.test(f)) return 'Gas + EV versions';
  return 'Gas';
};

/** Largest body version of the newest year that has Transport Canada dimensions (for the garage-fit tool) */
function dimsOf(m, y) {
  const dy = [y, ...m.years].find((x) => x.dims?.some((d) => d.length && d.width && d.height));
  if (!dy) return {};
  const d = dy.dims.filter((x) => x.length && x.width && x.height).sort((a, b) => b.length - a.length)[0];
  return { len: d.length, wd: d.width, ht: d.height, wb: d.wheelbase, dy: dy.year === y.year ? undefined : dy.year };
}

export async function buildBuyerData(live, log) {
  const latest = (m) => m.years.find((y) => y.page && y.year <= nowYear() + 1);

  // finder / calculator / VIN index rows
  const finder = [];
  for (const m of live) {
    const y = latest(m);
    if (!y) continue;
    const gas = y.variants.filter((v) => v.comb && v.type !== 'EV' && v.type !== 'FCV').sort((a, b) => b.comb - a.comb)[0];
    const ev = y.variants.filter((v) => v.type === 'EV' && v.kwh).sort((a, b) => a.kwh - b.kwh)[0];
    finder.push({
      mk: m.make,
      md: m.model,
      ms: m.makeSlug,
      s: m.slug,
      y: y.year,
      years: m.years.filter((x) => x.page).map((x) => x.year),
      body: yearBody(y),
      cls: y.cls,
      pw: power(y),
      awd: y.drives.some((d) => /4-Wheel|All-Wheel|4WD|AWD|Part-time/i.test(d)) || undefined,
      mpg: y.mpg?.max,
      range: y.range,
      // per-100-mile energy of the most efficient version, for the cost calculator
      gal: gas ? Math.round((100 / gas.comb) * 1000) / 1000 : undefined,
      premium: gas ? /premium/i.test(gas.fuel ?? '') || undefined : undefined,
      kwh: ev ? Math.round(ev.kwh * 100) / 100 : undefined,
      cost: y.cost,
      st: y.overall,
      rc: y.recalls.length,
      cp: y.complaints.total,
      ...dimsOf(m, y),
      // U.S. specs from vPIC (when decoded): most powerful engine, most seats, driver aids standard on every version
      // (the newest years are decoded last, so fall back to the closest decoded year within two years)
      ...((sp) => ({
        hp: sp?.hp?.[1],
        seats: sp?.seats?.[1],
        std: sp?.features ? Object.values(sp.features).filter((v) => v === 'std').length : undefined,
      }))(y.specs ?? m.years.filter((x) => x.specs && Math.abs(x.year - y.year) <= 2).sort((p, q) => Math.abs(p.year - y.year) - Math.abs(q.year - y.year))[0]?.specs),
      pop: m.popularity?.views30 ?? 0,
      ph: m.photo?.file,
      es: y.es || undefined,
    });
  }
  await writeJson(SITE + 'finder.json', finder);

  // vs pairs: each popular, currently sold model × its top rivals in the latest year (both still on sale)
  const current = (m) => (latest(m)?.year ?? 0) >= nowYear() - 1;
  const byKey = new Map(live.filter(current).map((m) => [`${m.makeSlug}/${m.slug}`, m]));
  const pairs = new Map();
  for (const m of [...byKey.values()].sort((a, b) => (b.popularity?.views30 ?? 0) - (a.popularity?.views30 ?? 0))) {
    // this year's lineup first: next-year models trickle in during the year
    const y = m.years.find((x) => x.page && x.year <= nowYear() && (x.similar?.length ?? 0) >= 3) ?? latest(m);
    for (const s of (y?.similar ?? []).slice(0, 4)) {
      const other = byKey.get(`${s.makeSlug}/${s.slug}`);
      if (!other || m.thin || other.thin) continue;
      // variants of the same car ("296-gtb" vs "296-gts", "rav4" vs "rav4-prime") aren't real rivals
      if (m.makeSlug === other.makeSlug && (m.slug.split('-')[0] === other.slug.split('-')[0])) continue;
      const [a, b] = [m, other].sort((p, q) => `${p.make} ${p.model}`.localeCompare(`${q.make} ${q.model}`));
      const id = `${a.makeSlug}-${a.slug}-vs-${b.makeSlug}-${b.slug}`;
      if (!pairs.has(id)) pairs.set(id, { id, a: [a.makeSlug, a.slug], b: [b.makeSlug, b.slug], pop: (a.popularity?.views30 ?? 0) + (b.popularity?.views30 ?? 0) });
    }
  }
  const vs = [...pairs.values()].sort((a, b) => b.pop - a.pop).slice(0, MAX_VS);
  await writeJson(SITE + 'vs.json', vs);

  // national average fuel prices used by fueleconomy.gov (EPA/DOE, public domain) for the cost calculator
  let prices;
  try {
    prices = await getJson('https://www.fueleconomy.gov/ws/rest/fuelprices', { headers: { Accept: 'application/json' } });
  } catch (e) {
    log(`  fuel prices: ${e.message}`);
  }
  await writeJson(SITE + 'fuelprices.json', prices ?? {});
  log(`Buyer data: ${finder.length} finder rows, ${vs.length} comparison pages, fuel prices ${prices ? 'ok' : 'missing'}`);
}
