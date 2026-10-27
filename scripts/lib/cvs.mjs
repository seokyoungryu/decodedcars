// Dimensions and curb weight: Canadian Vehicle Specifications (Transport Canada, Collision Investigation and
// Research Division), served by NHTSA vPIC. Licensed under the Open Government Licence – Canada (commercial use
// allowed with attribution — shown in the site footer and on spec tables).
// One call per make + model year returns every model; cached, refreshed every 60 days for recent years.
// vPIC has "automated traffic rate control", so we go slowly.
import { CACHE, readJson, today, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const FILE = CACHE + 'cvs.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FIELDS = { OL: 'length', OW: 'width', OH: 'height', WB: 'wheelbase', CW: 'weight', TWF: 'trackF', TWR: 'trackR', WD: 'weightDist' };

/** jobs: [{ make, year }] (EPA make names). Returns { 'MAKE|year': { at, models: [{ name, length, … }] } } */
export async function collectCvs(jobs, { budget = 600, log }) {
  const cache = await readJson(FILE, {});
  const now = new Date().getUTCFullYear();
  const stale = (e, year) => !e || (year >= now - 2 && Date.parse(today()) - Date.parse(e.at) > 60 * 86400e3);
  const todo = jobs.filter((j) => stale(cache[`${j.make.toUpperCase()}|${j.year}`], j.year)).sort((a, b) => b.year - a.year);
  let calls = 0;
  for (const j of todo) {
    if (calls >= budget) break;
    calls++;
    try {
      const r = await getJson(`https://vpic.nhtsa.dot.gov/api/vehicles/GetCanadianVehicleSpecifications/?Year=${j.year}&Make=${encodeURIComponent(j.make)}&units=US&format=json`);
      const models = (r?.Results ?? []).map((x) => {
        const o = {};
        for (const { Name, Value } of x.Specs ?? []) {
          if (Name === 'Model') o.name = String(Value).trim();
          else if (FIELDS[Name]) o[FIELDS[Name]] = Name === 'WD' ? Value : Math.round(Number(Value) * 10) / 10 || undefined;
        }
        return o;
      });
      cache[`${j.make.toUpperCase()}|${j.year}`] = { at: today(), models: models.filter((m) => m.name) };
    } catch (e) {
      log(`  cvs ${j.make} ${j.year}: ${e.message}`);
    }
    await sleep(400);
  }
  await writeJson(FILE, cache);
  log(`Dimensions (Transport Canada CVS): ${calls} make-years fetched, ${Math.max(0, todo.length - calls)} left`);
  return cache;
}
