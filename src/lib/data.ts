// Build-time readers for data/site (written by scripts/lib/aggregate.mjs)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'data', 'site');
const cache = new Map<string, unknown>();
function load<T>(name: string, fallback: T): T {
  if (!cache.has(name)) {
    try {
      cache.set(name, JSON.parse(readFileSync(join(DIR, name), 'utf8')));
    } catch {
      cache.set(name, fallback);
    }
  }
  return cache.get(name) as T;
}

export interface Variant {
  name: string;
  cls?: string;
  drive?: string;
  trans?: string;
  cyl?: number;
  displ?: number;
  fuel?: string;
  type?: string;
  turbo?: boolean;
  city?: number;
  hwy?: number;
  comb?: number;
  cost?: number;
  range?: number;
  kwh?: number;
  motor?: string;
  charge?: number;
  co2?: number;
  feScore?: number;
  ghgScore?: number;
  save5?: number;
  startStop?: boolean;
  engDesc?: string;
  vsClass?: number;
}
export interface Rating {
  desc: string;
  overall?: number;
  front?: number;
  frontDriver?: number;
  frontPassenger?: number;
  side?: number;
  sidePole?: number;
  rollover?: number;
  rolloverRisk?: number;
  tip?: string;
  esc?: string;
  fcw?: string;
  ldw?: string;
  frontPic?: string;
  sidePic?: string;
}
export interface Dims { name: string; length?: number; width?: number; height?: number; wheelbase?: number; weight?: number; trackF?: number; trackR?: number; weightDist?: string }
export interface Similar { make: string; model: string; makeSlug: string; slug: string; year: number; es?: boolean; mpg?: number; range?: number; overall?: number; recalls: number }
export interface Photo { file: string; w?: number; h?: number; caption: string; artist: string; license: string; licenseUrl?: string; page: string }
export interface Complaints { total: number; crash?: number; fire?: number; injured?: number; deaths?: number; comps: [string, number][]; miles?: number; months?: Record<string, number> }
export interface Specs {
  n: number;
  trims: string[];
  engines: { label: string; hp?: [number, number]; kw?: number }[];
  hp?: [number, number];
  trans: string[];
  drive: string[];
  seats?: [number, number];
  rows?: number;
  features?: Record<string, 'std' | 'some' | 'opt'>;
  led?: boolean;
  plants: string[];
}
export interface Year {
  year: number;
  cls?: string;
  variants: Variant[];
  mpg?: { min: number; max: number; city: number; hwy: number };
  range?: number;
  cost?: number;
  classAvg?: number;
  recalls: string[];
  complaints: Complaints;
  rating?: Rating[];
  overall?: number;
  added?: string;
  rich: boolean;
  page: boolean;
  /** also has a Spanish page (/es/…) */
  es?: boolean;
  dims: Dims[];
  drives: string[];
  fuels: string[];
  engines: string[];
  charge?: number;
  co2?: number;
  feScore?: number;
  ghgScore?: number;
  save5?: number;
  similar?: Similar[];
  /** U.S. specs from NHTSA vPIC (decoded VIN patterns ≈ trims/configurations) */
  specs?: Specs;
  /** medians of rival model years (same year, body, tier, size) */
  peer?: { n: number; mpg?: number; complaints?: number; recalls?: number; hp?: number };
}
export interface Model {
  key: string;
  make: string;
  model: string;
  makeSlug: string;
  slug: string;
  years: Year[];
  popularity?: { title: string; views30: number; week: number; prevWeek: number; change?: number; series: number[]; shared?: boolean };
  recent90: number;
  overview?: { title: string; text: string; url: string };
  overviewEs?: { title: string; text: string; url: string };
  photo?: Photo;
  verdict?: Verdict;
}
export interface Campaign { id: string; date?: string; mfg?: string; units?: number; comps: string[]; summary?: string; consequence?: string; remedy?: string; doNotDrive?: boolean; parkOutside?: boolean }
export interface MakeEntry { slug: string; name: string; models: { slug: string; name: string; from: number; to: number; recalls: number; complaints: number; mpg?: number; range?: number; views30: number; photo?: string; cls?: string }[] }
type Card = { make: string; model: string; makeSlug: string; slug: string; latest?: number; year?: number; photo?: string; [k: string]: unknown };
export interface Rankings {
  trending: Card[];
  popular: Card[];
  siteViews: Card[];
  recentRecalls: { id: string; date: string; comp?: string; units?: number; doNotDrive?: boolean; models: Card[] }[];
  complaints90: Card[];
  year: number;
  bestMpg: Card[];
  longestRange: Card[];
  cheapestFuel: Card[];
  safest: Card[];
  newModels: Card[];
}

export const meta = load('meta.json', { updated: '', date: '', models: 0, yearPages: 0 });
export const makes = () => load('makes.json', [] as MakeEntry[]);
export const model = (make: string, slug: string) => load<Model | null>(`models/${make}/${slug}.json`, null);
export const campaigns = () => load('campaigns.json', {} as Record<string, Campaign>);
export const rankings = () => load<Rankings>('rankings.json', { trending: [], popular: [], siteViews: [], recentRecalls: [], complaints90: [], year: 0, bestMpg: [], longestRange: [], cheapestFuel: [], safest: [], newModels: [] });
export const noindex = () => new Set(load('noindex.json', [] as string[]));

/* ── formatting ── */
export const n = (x?: number) => (x == null ? '–' : x.toLocaleString('en-US'));
export const usd = (x?: number) => (x == null ? '–' : `$${x.toLocaleString('en-US')}`);
export const date = (d?: string) => (d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '–');
export const title = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
export const href = (c: { makeSlug: string; slug: string }, year?: number) => `/${c.makeSlug}/${c.slug}${year ? `/${year}` : ''}`;
/** 'Updated Oct 27, 2026'; with a language, just the date in that language */
export function updatedLabel(lang?: 'en' | 'es') {
  if (!meta.updated) return '';
  const d = new Date(meta.updated).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return lang ? d : `Updated ${d}`;
}
/** "FUEL SYSTEM, GASOLINE:DELIVERY:FUEL PUMP" → "Fuel System, Gasoline › Delivery › Fuel Pump" */
export const comp = (s?: string) => (s ? title(s).replace(/:/g, ' › ') : '–');

/* ── buyer tools ── */
export interface VerdictYear { year: number; complaints: number; recalls: number; crash: number; fire: number; top?: string; overall?: number }
export interface Verdict { best: VerdictYear; worst?: VerdictYear; compared: number }
export interface FinderRow {
  mk: string; md: string; ms: string; s: string; y: number; years: number[]; body: string; cls?: string; pw: string; awd?: boolean;
  mpg?: number; range?: number; gal?: number; premium?: boolean; kwh?: number; cost?: number; st?: number; rc: number; cp: number; len?: number; wd?: number; ht?: number; wb?: number; dy?: number; pop: number; ph?: string;
}
export interface VsPair { id: string; a: [string, string]; b: [string, string]; pop: number }
export const finder = () => load('finder.json', [] as FinderRow[]);
export const vsPairs = () => load('vs.json', [] as VsPair[]);
export const fuelPrices = () => load('fuelprices.json', {} as Record<string, string>);
/** comparison pages that include this model */
export const vsFor = (makeSlug: string, slug: string) => vsPairs().filter((p) => (p.a[0] === makeSlug && p.a[1] === slug) || (p.b[0] === makeSlug && p.b[1] === slug));
