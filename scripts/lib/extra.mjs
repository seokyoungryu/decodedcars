// Extra public sources, all keyed like the recall/complaint data (NHTSA make|model → model year):
//   investigations  NHTSA ODI defect investigations (FLAT_INV.zip), opened since 2010
//   bulletins       manufacturer communications filed with NHTSA: technical service bulletins, warranty extensions,
//                   service campaigns, over-the-air updates (TSBS_RECEIVED_*.zip, received since 2015)
//   fars            NHTSA Fatality Analysis Reporting System: vehicles involved in fatal crashes and occupant deaths,
//                   by vPIC make/model and model year (FARS<year>NationalCSV.zip, last 3 published years)
//   wikidata        CC0 facts (class, official site, predecessor/successor, assembly plants) for the Wikipedia titles we use
// US Government works and CC0. FARS also holds driver and location details: we count vehicles and deaths only.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync } from 'node:fs';
import { CACHE, isoDate, readJson, writeJson } from './store.mjs';
import { download, USER_AGENT } from './http.mjs';
import { makeKey, norm } from './keys.mjs';
import { MIN_YEAR } from './epa.mjs';

const ODI = 'https://static.nhtsa.gov/odi/ffdd/';
const TSB_FILES = ['tsbs/TSBS_RECEIVED_2015-2019.zip', 'tsbs/TSBS_RECEIVED_2020-2024.zip', 'tsbs/TSBS_RECEIVED_2025-2026.zip'];
const keyOf = (make, model) => `${makeKey(make)}|${norm(model)}`;
const clip = (s = '', n) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s\S*$/, '')}…` : s);
// NHTSA text is upper case in older records
const sentence = (s = '') => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase()) : s);

async function* lines(zipPath, encoding = 'latin1') {
  const p = spawn('unzip', ['-p', zipPath]);
  p.stdout.setEncoding(encoding);
  const rl = createInterface({ input: p.stdout, crlfDelay: Infinity });
  for await (const line of rl) if (line) yield line;
}

/** Investigations → Map<key, Map<year, Set<id>>> + details per id */
export async function collectInvestigations(log) {
  const zip = CACHE + 'nhtsa/FLAT_INV.zip';
  await download(ODI + 'inv/FLAT_INV.zip', zip);
  const byModelYear = new Map();
  const items = {};
  for await (const line of lines(zip, 'utf8')) {
    // 1 ACTION 2 MAKE 3 MODEL 4 YEAR 5 COMPNAME 6 MFR 7 ODATE 8 CDATE 9 CAMPNO 10 SUBJECT 11 SUMMARY
    const [id, make, model, yearTxt, comp, , odate, cdate, camp, subject, summary] = line.split('\t');
    const year = Number(yearTxt);
    if (!(year >= MIN_YEAR && year < 9999) || !odate || odate < '2010') continue;
    const k = keyOf(make, model);
    const t = byModelYear.get(k) ?? byModelYear.set(k, new Map()).get(k);
    (t.get(year) ?? t.set(year, new Set()).get(year)).add(id);
    items[id] ??= {
      id,
      kind: id.slice(0, 2), // PE preliminary evaluation, EA engineering analysis, RQ recall query, DP defect petition, AQ audit query
      opened: isoDate(odate),
      closed: cdate ? isoDate(cdate) : undefined,
      recall: camp?.trim() || undefined,
      comp: comp?.trim(),
      subject: sentence(subject?.trim()),
      summary: clip(sentence(summary?.replace(/\s*â(?:\u0080\u0093|\u0080\u0094)?\s*/g, ' – ').replace(/\s+/g, ' ').trim()), 600),
    };
  }
  log(`Investigations: ${Object.keys(items).length} since 2010 (${Object.values(items).filter((x) => !x.closed).length} open)`);
  return { byModelYear, items };
}

/** Manufacturer communications → Map<key, Map<year, Set<id>>> + details per id (TSV: one row per product × component) */
export async function collectBulletins(log) {
  const byModelYear = new Map();
  const items = {};
  for (const f of TSB_FILES) {
    const zip = CACHE + 'nhtsa/' + f.split('/')[1];
    await download(ODI + f, zip);
    for await (const line of lines(zip, 'utf8')) {
      // 1 NHTSA ID 3 added 4 document id 5 date 7 type 8 make 9 model 10 year 11 components 14 summary
      const c = line.split('\t');
      const year = Number(c[9]);
      if (!(year >= MIN_YEAR && year < 9999)) continue;
      const id = c[0];
      const k = keyOf(c[7], c[8]);
      const t = byModelYear.get(k) ?? byModelYear.set(k, new Map()).get(k);
      (t.get(year) ?? t.set(year, new Set()).get(year)).add(id);
      const it = (items[id] ??= { id, doc: c[3]?.trim(), date: isoDate(c[4] || c[2]), type: kindOf(c[6]?.trim(), c[13]), comps: [], summary: clip(sentence(c[13]?.replace(/\s*â(?:\u0080\u0093|\u0080\u0094)?\s*/g, ' – ').replace(/\s+/g, ' ').trim()), 420) });
      for (const comp of components(c[10])) if (!it.comps.includes(comp)) it.comps.push(comp);
    }
  }
  log(`Manufacturer communications: ${Object.keys(items).length} since 2015`);
  return { byModelYear, items };
}

// NHTSA component names can contain commas ("FUEL SYSTEM, GASOLINE"): glue the qualifier back on
const QUALIFIER = /^(GASOLINE|DIESEL|OTHER|HYDROGEN|PROPANE|NATURAL GAS|CNG|LPG)$/;
function components(txt = '') {
  const out = [];
  for (const p of txt.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (QUALIFIER.test(p) && out.length) out[out.length - 1] += `, ${p}`;
    else out.push(p);
  }
  return out;
}
// what kind of communication: the type field is often "Other", the summary says what it is
function kindOf(type = '', summary = '') {
  const s = summary.slice(0, 200);
  if (/warranty/i.test(type) || /warranty (extension|enhancement|program)|extended (limited )?warranty|special (service|coverage)|emissions? warranty/i.test(s)) return 'Warranty extension';
  if (/service campaign|product improvement|customer satisfaction|safety improvement|service action/i.test(s) || /campaign/i.test(type)) return 'Service campaign';
  if (/over the air|ota/i.test(type) || /over[- ]the[- ]air/i.test(s)) return 'Over-the-air update';
  return 'Service bulletin';
}

/** FARS: fatal-crash vehicles and occupant deaths per vPIC make|model and model year, last 3 published data years */
export async function collectFars(log) {
  const now = new Date().getUTCFullYear();
  const years = [];
  for (let y = now - 1; y >= now - 6 && years.length < 3; y--) {
    const url = `https://static.nhtsa.gov/nhtsa/downloads/FARS/${y}/National/FARS${y}NationalCSV.zip`;
    const zip = CACHE + `fars/FARS${y}.zip`;
    try {
      if (!existsSync(zip)) await download(url, zip);
      years.push({ y, zip });
    } catch {
      /* not published yet */
    }
  }
  const byModelYear = new Map();
  for (const { y, zip } of years) {
    const p = spawn('unzip', ['-p', zip, `FARS${y}NationalCSV/vehicle.csv`]);
    p.stdout.setEncoding('latin1');
    const rl = createInterface({ input: p.stdout, crlfDelay: Infinity });
    let head;
    for await (const line of rl) {
      const f = splitCsv(line);
      if (!head) {
        head = Object.fromEntries(f.map((h, i) => [h.replace(/^﻿/, ''), i]));
        continue;
      }
      const year = Number(f[head.MOD_YEAR]);
      const make = f[head.VPICMAKENAME];
      const model = f[head.VPICMODELNAME];
      if (!(year >= MIN_YEAR && year < 9998) || !make || !model || /^(Unknown|Not Reported)/i.test(model)) continue;
      const k = keyOf(make, model);
      const t = byModelYear.get(k) ?? byModelYear.set(k, new Map()).get(k);
      const s = t.get(year) ?? t.set(year, { v: 0, d: 0, roll: 0 }).get(year);
      s.v++;
      s.d += Number(f[head.DEATHS]) || 0;
      if (Number(f[head.ROLLOVER]) > 0 && Number(f[head.ROLLOVER]) < 9) s.roll++;
    }
  }
  const span = years.length ? `${Math.min(...years.map((x) => x.y))}–${Math.max(...years.map((x) => x.y))}` : '';
  log(`FARS: ${span || 'no files'} (${byModelYear.size} make/models)`);
  return { byModelYear, span };
}

function splitCsv(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') out.push(cur), (cur = '');
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Wikidata facts for each Wikipedia title (CC0). Cached 30 days per title. */
export async function collectWikidata(titles, { log, budget = 400 } = {}) {
  const file = CACHE + 'wikidata.json';
  const cache = await readJson(file, {});
  const stale = (t) => !cache[t] || Date.now() - Date.parse(cache[t].at) > 30 * 864e5;
  const todo = [...new Set(titles.filter(Boolean))].filter(stale).slice(0, budget);
  const api = (q) => fetch(`https://www.wikidata.org/w/api.php?${q}&format=json`, { headers: { 'User-Agent': USER_AGENT } }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`wikidata ${r.status}`))));
  const ids = (e, p) => (e.claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak.datavalue?.value?.id).filter(Boolean);
  const str = (e, p) => (e.claims?.[p] ?? []).map((c) => c.mainsnak.datavalue?.value).find((v) => typeof v === 'string');
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50);
    const j = await api(`action=wbgetentities&sites=enwiki&props=claims|sitelinks&sitefilter=enwiki&titles=${encodeURIComponent(batch.join('|'))}`);
    const got = {};
    for (const e of Object.values(j.entities ?? {})) {
      const title = e.sitelinks?.enwiki?.title;
      if (!title || !e.claims) continue;
      got[title] = { id: e.id, cls: ids(e, 'P279'), site: str(e, 'P856'), follows: ids(e, 'P155'), followedBy: ids(e, 'P156'), plants: ids(e, 'P1071'), power: ids(e, 'P516'), maker: ids(e, 'P176') };
    }
    // labels for every referenced item
    const refs = [...new Set(Object.values(got).flatMap((g) => [...g.cls, ...g.follows, ...g.followedBy, ...g.plants, ...g.power, ...g.maker]))];
    const labels = {};
    for (let k = 0; k < refs.length; k += 50) {
      const l = await api(`action=wbgetentities&props=labels|sitelinks&languages=en&sitefilter=enwiki&ids=${refs.slice(k, k + 50).join('|')}`);
      for (const e of Object.values(l.entities ?? {})) labels[e.id] = { label: e.labels?.en?.value, wiki: e.sitelinks?.enwiki?.title };
    }
    const at = new Date().toISOString();
    for (const t of batch) {
      const g = got[t];
      const L = (a) => a.map((id) => labels[id]?.label).filter(Boolean);
      cache[t] = g
        ? { at, id: g.id, cls: L(g.cls), site: g.site, follows: g.follows.map((id) => labels[id]).filter((x) => x?.label), followedBy: g.followedBy.map((id) => labels[id]).filter((x) => x?.label), plants: L(g.plants), power: L(g.power).slice(0, 6), maker: L(g.maker) }
        : { at };
    }
  }
  await writeJson(file, cache);
  log?.(`Wikidata: ${todo.length} titles refreshed, ${Object.values(cache).filter((c) => c.id).length} with an item`);
  return cache;
}
