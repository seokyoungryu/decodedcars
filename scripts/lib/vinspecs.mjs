// U.S. trims, horsepower, transmissions, seating and driver-assist features from NHTSA vPIC (US Government work).
// vPIC decodes a VIN *pattern* (characters 1–8, then "*" for the check digit, then model-year and plant characters)
// into what the manufacturer reported for that configuration: trim, engine HP, transmission, seats, and whether
// features like automatic emergency braking are Standard or Optional. Patterns come from NHTSA's own complaint file
// (see nhtsa-files.mjs) — most-reported configurations first. A pattern never changes, so each is decoded once.
// vPIC has "automated traffic rate control": one call at a time, 350 ms apart, a daily budget.
import { CACHE, readJson, writeJson } from './store.mjs';
import { getJson } from './http.mjs';

const FILE = CACHE + 'vinspecs.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const FEATURES = {
  CIB: 'Automatic emergency braking',
  PedestrianAutomaticEmergencyBraking: 'Pedestrian emergency braking',
  ForwardCollisionWarning: 'Forward collision warning',
  BlindSpotMon: 'Blind-spot monitoring',
  BlindSpotIntervention: 'Blind-spot intervention',
  RearCrossTrafficAlert: 'Rear cross-traffic alert',
  RearAutomaticEmergencyBraking: 'Rear automatic braking',
  LaneDepartureWarning: 'Lane departure warning',
  LaneKeepSystem: 'Lane keeping assist',
  LaneCenteringAssistance: 'Lane centering',
  AdaptiveCruiseControl: 'Adaptive cruise control',
  ParkAssist: 'Parking assist',
  RearVisibilitySystem: 'Backup camera',
  SemiautomaticHeadlampBeamSwitching: 'Automatic high beams',
  AdaptiveDrivingBeam: 'Adaptive driving beam',
  KeylessIgnition: 'Keyless start',
};
const KEEP = ['Trim', 'Series', 'EngineHP', 'EngineModel', 'DisplacementL', 'EngineCylinders', 'Turbo', 'ElectrificationLevel', 'OtherEngineInfo', 'TransmissionStyle', 'TransmissionSpeeds', 'DriveType', 'Seats', 'SeatRows', 'Doors', 'BodyClass', 'LowerBeamHeadlampLightSource', 'PlantCity', 'PlantState', 'PlantCountry', ...Object.keys(FEATURES)];

/**
 * jobs: [{ key, year, patterns: string[], pri }] (highest priority first).
 * Returns { 'key|year': decoded[] } for every job whose patterns have been decoded so far.
 */
export async function collectVinSpecs(jobs, { budget = 2500, log }) {
  const cache = await readJson(FILE, {});
  let calls = 0;
  let failed = 0;
  for (const j of jobs) {
    for (const p of j.patterns) {
      if (p in cache) continue;
      if (calls >= budget) break;
      calls++;
      try {
        const r = (await getJson(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(p)}?format=json`))?.Results?.[0];
        cache[p] = r?.Make ? Object.fromEntries(KEEP.map((k) => [k, String(r[k] ?? '').trim()]).filter(([, v]) => v && v !== 'Not Applicable')) : null;
      } catch (e) {
        failed++;
        if (failed > 20) break;
      }
      await sleep(350);
      if (calls % 200 === 0) await writeJson(FILE, cache);
    }
    if (calls >= budget || failed > 20) break;
  }
  await writeJson(FILE, cache);
  const out = {};
  for (const j of jobs) {
    const decoded = j.patterns.map((p) => cache[p]).filter(Boolean);
    if (decoded.length) out[`${j.key}|${j.year}`] = decoded;
  }
  const left = jobs.reduce((s, j) => s + j.patterns.filter((p) => !(p in cache)).length, 0);
  log(`vPIC specs: ${calls} patterns decoded${failed ? `, ${failed} failed` : ''}; ${Object.keys(out).length} model-years have specs; ${left} patterns left`);
  return out;
}
