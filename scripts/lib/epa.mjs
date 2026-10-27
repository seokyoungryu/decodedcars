// EPA/DOE fuel economy data (vehicles.csv, ~50k rows) — public domain per the EPA Data License.
// We use only the numbers (specs, MPG, range, fuel cost); never fueleconomy.gov photos or page text.
// This file decides the model universe: every make + baseModel + model year from MIN_YEAR on.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { CACHE } from './store.mjs';
import { download } from './http.mjs';
import { makeKey, norm, slug, splitCsv } from './keys.mjs';

export const MIN_YEAR = 2005;
const URL = 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip';
const ZIP = CACHE + 'epa/vehicles.csv.zip';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
/** "Tue Sep 29 00:00:00 EDT 2026" → 2026-09-29 */
const epaDate = (s) => {
  const m = String(s).match(/^\w{3} (\w{3}) (\d{2}) .* (\d{4})$/);
  return m ? `${m[3]}-${String(MONTHS[m[1]]).padStart(2, '0')}-${m[2]}` : undefined;
};

export async function collectEpa(log) {
  const fresh = await download(URL, ZIP);
  const csv = execFileSync('unzip', ['-p', ZIP], { maxBuffer: 200 * 1024 * 1024 }).toString('utf8');
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const head = splitCsv(lines[0]);
  const ix = Object.fromEntries(head.map((h, i) => [h, i]));
  const maxYear = new Date().getUTCFullYear() + 2;

  const models = new Map();
  for (const line of lines.slice(1)) {
    const c = splitCsv(line);
    const get = (k) => c[ix[k]];
    const year = Number(get('year'));
    if (year < MIN_YEAR || year > maxYear) continue;
    const make = get('make').trim();
    const base = (get('baseModel') || get('model')).trim();
    const k = `${makeKey(make)}|${norm(base)}`;
    let m = models.get(k);
    if (!m) models.set(k, (m = { key: k, make, model: base, makeSlug: slug(make), slug: slug(base), years: {} }));
    const y = (m.years[year] ??= { variants: [] });
    const atv = get('atvType');
    y.variants.push({
      id: Number(get('id')),
      name: get('model').trim(),
      cls: get('VClass'),
      drive: get('drive') || undefined,
      trans: get('trany') || undefined,
      cyl: num(get('cylinders')),
      displ: num(get('displ')),
      fuel: get('fuelType1') || get('fuelType'),
      type: atv || undefined, // EV, Hybrid, Plug-in Hybrid, Diesel, FFV, CNG…
      turbo: get('tCharger') === 'T' || undefined,
      city: num(get('city08')),
      hwy: num(get('highway08')),
      comb: num(get('comb08')),
      cost: num(get('fuelCost08')), // annual fuel cost, USD
      range: num(get('range')) || num(get('rangeA')), // EV range, miles
      kwh: num(get('combE')), // kWh/100 mi
      motor: get('evMotor') || undefined,
      added: epaDate(get('createdOn')),
    });
  }
  log(`EPA: ${models.size} models (${MIN_YEAR}+)${fresh ? ', new file' : ', unchanged'}`);
  return models;
}

