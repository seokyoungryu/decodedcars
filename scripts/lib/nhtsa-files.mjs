// NHTSA ODI bulk flat files (updated daily, tab-delimited, read as a stream so 300 MB+ files are fine).
//   Recalls:    FLAT_RCL_POST_2010.zip
//   Complaints: COMPLAINTS_RECEIVED_YYYY-YYYY.zip (by date received)
// US Government work. Complaint files also hold personal fields (city, partial VIN, operator name,
// dealer contact) and owner-written narratives: we read only make/model/year/component/outcome
// counts/dates and never store the narrative or any personal field.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { CACHE, isoDate } from './store.mjs';
import { download } from './http.mjs';
import { makeKey, norm } from './keys.mjs';
import { MIN_YEAR } from './epa.mjs';

const BASE = 'https://static.nhtsa.gov/odi/ffdd/';
const RECALL_FILE = 'rcl/FLAT_RCL_POST_2010.zip';
export const COMPLAINT_FILES = ['cmpl/COMPLAINTS_RECEIVED_2015-2019.zip', 'cmpl/COMPLAINTS_RECEIVED_2020-2024.zip', 'cmpl/COMPLAINTS_RECEIVED_2025-2026.zip'];

async function* rows(zipPath) {
  const p = spawn('unzip', ['-p', zipPath]);
  // NHTSA files are Windows-1252; latin1 keeps every byte without throwing
  p.stdout.setEncoding('latin1');
  const rl = createInterface({ input: p.stdout, crlfDelay: Infinity });
  for await (const line of rl) if (line) yield line.split('\t');
}

const keyOf = (make, model) => `${makeKey(make)}|${norm(model)}`;
/** key → original NHTSA make/model spelling (the ratings API wants NHTSA names, e.g. "F-150" not "F150") */
export const nhtsaNames = new Map();
const remember = (k, make, model) => nhtsaNames.has(k) || nhtsaNames.set(k, { make: make.trim(), model: model.trim() });

/**
 * Recalls → { byModelYear: Map<key, Map<year, Set<campno>>>, campaigns: { campno: {...} } }
 * Text fields (summary/consequence/remedy) are NHTSA's public recall summaries.
 */
export async function collectRecalls(log) {
  const zip = CACHE + 'nhtsa/' + RECALL_FILE.split('/')[1];
  const fresh = await download(BASE + RECALL_FILE, zip);
  const byModelYear = new Map();
  const campaigns = {};
  let n = 0;
  for await (const f of rows(zip)) {
    // 2 CAMPNO 3 MAKE 4 MODEL 5 YEAR 7 COMPNAME 8 MFGNAME 11 RCLTYPECD 12 POTAFF 16 RCDATE 20 DEFECT 21 CONSEQUENCE 22 REMEDY 28 DO_NOT_DRIVE 29 PARK_OUTSIDE
    const [, camp, make, model, yearTxt, , comp, mfg, , , type, potaff, , , , rcdate, , , , defect, conseq, remedy, , , , , , dnd, park] = f;
    if (type !== 'V') continue; // vehicles only (not tires, equipment, child seats)
    const year = Number(yearTxt);
    if (!(year >= MIN_YEAR && year < 9999)) continue;
    n++;
    const k = keyOf(make, model);
    remember(k, make, model);
    const byYear = byModelYear.get(k) ?? byModelYear.set(k, new Map()).get(k);
    (byYear.get(year) ?? byYear.set(year, new Set()).get(year)).add(camp);
    let c = campaigns[camp];
    if (!c) {
      c = campaigns[camp] = {
        id: camp,
        date: isoDate(rcdate),
        mfg: mfg?.trim(),
        units: Number(potaff) || undefined,
        comps: [],
        summary: defect?.trim(),
        consequence: conseq?.trim(),
        remedy: remedy?.trim(),
        doNotDrive: dnd === 'Yes' || dnd === 'Y' || undefined,
        parkOutside: park === 'Yes' || park === 'Y' || undefined,
      };
    }
    if (comp && !c.comps.includes(comp.trim())) c.comps.push(comp.trim());
  }
  log(`Recalls: ${n} vehicle rows, ${Object.keys(campaigns).length} campaigns${fresh ? ', new file' : ', unchanged'}`);
  return { byModelYear, campaigns };
}

/**
 * Complaints → Map<key, Map<year, stats>> plus recent counts (last 90 days, all years) per model for rankings.
 * Counted once per ODI number (one complaint can list several components).
 */
export async function collectComplaints(log, since90) {
  const stats = new Map();
  const recent = new Map();
  let n = 0;
  for (const file of COMPLAINT_FILES) {
    const zip = CACHE + 'nhtsa/' + file.split('/')[1];
    try {
      await download(BASE + file, zip);
    } catch (e) {
      log(`  ${file}: ${e.message}`);
      continue;
    }
    for await (const f of rows(zip)) {
      // 2 ODINO 4 MAKE 5 MODEL 6 YEAR 7 CRASH 9 FIRE 10 INJURED 11 DEATHS 12 COMPDESC 17 LDATE 18 MILES 46 PROD_TYPE
      const odi = f[1];
      const year = Number(f[5]);
      if (f[45] !== 'V' || !(year >= MIN_YEAR && year < 9999)) continue;
      const k = keyOf(f[3], f[4]);
      remember(k, f[3], f[4]);
      const byYear = stats.get(k) ?? stats.set(k, new Map()).get(k);
      let s = byYear.get(year);
      if (!s) byYear.set(year, (s = { ids: new Set(), crash: 0, fire: 0, injured: 0, deaths: 0, comps: {}, months: {}, miles: [] }));
      // one row per component (same ODI number repeats); component names themselves contain commas ("FUEL SYSTEM, GASOLINE")
      const comp = String(f[11] || 'UNKNOWN OR OTHER').trim();
      s.comps[comp] = (s.comps[comp] ?? 0) + 1;
      if (s.ids.has(odi)) continue;
      s.ids.add(odi);
      n++;
      if (f[6] === 'Y') s.crash++;
      if (f[8] === 'Y') s.fire++;
      s.injured += Number(f[9]) || 0;
      s.deaths += Number(f[10]) || 0;
      const received = isoDate(f[16]);
      if (received) {
        const m = received.slice(0, 7);
        s.months[m] = (s.months[m] ?? 0) + 1;
        if (received >= since90) recent.set(k, (recent.get(k) ?? 0) + 1);
      }
      const miles = Number(f[17]);
      if (miles > 0 && miles < 500000 && s.miles.length < 400) s.miles.push(miles);
    }
  }
  log(`Complaints: ${n} vehicle complaints`);
  return { stats, recent };
}
