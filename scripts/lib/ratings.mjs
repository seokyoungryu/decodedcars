// NHTSA NCAP 5-Star Safety Ratings (api.nhtsa.gov, no key, US Government work): star ratings by test,
// rollover risk, safety technology availability and crash-test photo URLs (also US Government work).
// Ratings rarely change, so results are cached and only a daily slice is (re)fetched: missing model-years first,
// then the newest years again every 30 days. No published rate limit, so we stay slow and cap calls per run.
import { CACHE, readJson, today, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const FILE = CACHE + 'ratings.json';
const VERSION = 2; // bump when the stored fields change, so old entries are fetched again
const API = 'https://api.nhtsa.gov/SafetyRatings';
const FIRST_YEAR = 2011; // current NCAP program
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const star = (s) => (/^[1-5]$/.test(String(s)) ? Number(s) : undefined);
const tech = (s) => (/standard/i.test(s) ? 'Standard' : /optional/i.test(s) ? 'Optional' : /no/i.test(s) ? 'Not available' : undefined);

/** jobs: [{ key, year, make, model }] using NHTSA-style names */
export async function collectRatings(jobs, { budget = 2500, log }) {
  const cache = await readJson(FILE, {});
  const now = new Date().getUTCFullYear();
  const stale = (e, year) => !e || e.v !== VERSION || (year >= now - 1 && Date.parse(today()) - Date.parse(e.at) > 30 * 86400e3);
  const todo = jobs.filter((j) => j.year >= FIRST_YEAR && stale(cache[`${j.key}|${j.year}`], j.year));
  // never-fetched first; within that, released years (newest first) before current/future model years that are rarely rated yet
  const future = (j) => (j.year >= now ? 1 : 0);
  const has = (j) => (cache[`${j.key}|${j.year}`]?.v === VERSION ? 1 : 0);
  todo.sort((a, b) => has(a) - has(b) || future(a) - future(b) || b.year - a.year);

  let calls = 0;
  let done = 0;
  for (const j of todo) {
    if (calls >= budget) break;
    try {
      const list = await getJson(`${API}/modelyear/${j.year}/make/${encodeURIComponent(j.make)}/model/${encodeURIComponent(j.model)}`);
      calls++;
      const variants = [];
      for (const v of (list?.Results ?? []).slice(0, 6)) {
        const r = await getJson(`${API}/VehicleId/${v.VehicleId}`);
        calls++;
        const x = r?.Results?.[0];
        if (!x) continue;
        variants.push({
          desc: v.VehicleDescription,
          overall: star(x.OverallRating),
          front: star(x.OverallFrontCrashRating),
          frontDriver: star(x.FrontCrashDriversideRating),
          frontPassenger: star(x.FrontCrashPassengersideRating),
          side: star(x.OverallSideCrashRating),
          sidePole: star(x.SidePoleCrashRating),
          rollover: star(x.RolloverRating),
          rolloverRisk: x.RolloverPossibility ? Math.round(x.RolloverPossibility * 1000) / 10 : undefined,
          tip: x.dynamicTipResult?.trim() && x.dynamicTipResult.trim() !== 'Not Rated' ? x.dynamicTipResult.trim() : undefined,
          esc: tech(x.NHTSAElectronicStabilityControl ?? ''),
          fcw: tech(x.NHTSAForwardCollisionWarning ?? ''),
          ldw: tech(x.NHTSALaneDepartureWarning ?? ''),
          frontPic: /^https:\/\/static\.nhtsa\.gov\//.test(x.FrontCrashPicture ?? '') ? x.FrontCrashPicture : undefined,
          sidePic: /^https:\/\/static\.nhtsa\.gov\//.test(x.SideCrashPicture ?? '') ? x.SideCrashPicture : undefined,
        });
        await sleep(150);
      }
      cache[`${j.key}|${j.year}`] = { v: VERSION, at: today(), variants };
      done++;
    } catch (e) {
      log(`  rating ${j.make} ${j.model} ${j.year}: ${e.message}`);
      calls++;
    }
    await sleep(150);
    if (done % 200 === 0) await writeJson(FILE, cache);
  }
  await writeJson(FILE, cache);
  log(`Safety ratings: ${done} model-years updated (${calls} calls), ${Math.max(0, todo.length - done)} left`);
  return cache;
}
