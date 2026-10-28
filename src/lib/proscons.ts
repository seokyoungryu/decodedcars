// Data-based pros & cons for a model year: EPA, NHTSA and vPIC figures compared with the class average and with
// rival model years (same year, body style, market tier and size). Our own comparison — not owner or press reviews.
import type { Campaign, Model, Year } from '@/lib/data';
import { classNoun } from '@/lib/describe';

export interface Point {
  title: string;
  detail?: string;
}
const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100);
const list = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);
const KEY_TECH = ['Automatic emergency braking', 'Blind-spot monitoring', 'Adaptive cruise control', 'Lane keeping assist', 'Rear cross-traffic alert'];

export function prosCons(m: Model, y: Year, recalls: Campaign[]): { pros: Point[]; cons: Point[] } {
  const pros: Point[] = [];
  const cons: Point[] = [];
  const now = new Date().getUTCFullYear();
  const cls = classNoun(y.cls);
  const peer = y.peer;
  const ev = y.fuels.includes('EV') && !y.fuels.some((f) => /Gasoline|Diesel|Hybrid/.test(f));

  // efficiency
  if (!ev && y.mpg && y.classAvg) {
    const d = pct(y.mpg.max, y.classAvg);
    if (d >= 15) pros.push({ title: 'Excellent fuel economy', detail: `Up to ${y.mpg.max} MPG combined — ${d}% better than the average ${y.year} ${cls} (${y.classAvg} MPG).` });
    else if (d <= -12) cons.push({ title: 'Below-average fuel economy', detail: `Best version gets ${y.mpg.max} MPG combined, ${-d}% below the ${y.year} ${cls} average of ${y.classAvg} MPG.` });
  }
  if (y.range) {
    if (y.range >= 300) pros.push({ title: 'Long EV range', detail: `Up to ${y.range} miles on a charge (EPA).` });
    else if (y.range < 200 && ev) cons.push({ title: 'Short EV range', detail: `Up to ${y.range} miles on a charge (EPA) — plan around charging.` });
  }
  const gas = y.variants.filter((v) => v.comb && v.type !== 'EV');
  if (gas.length && gas.every((v) => /premium/i.test(v.fuel ?? ''))) cons.push({ title: 'Premium fuel required', detail: 'Every gasoline version is rated for premium, which raises running costs.' });

  // performance
  const hp = y.specs?.hp;
  if (hp && peer?.hp) {
    if (hp[1] >= peer.hp * 1.25) pros.push({ title: 'Strong performance', detail: `Up to ${hp[1]} hp, versus about ${peer.hp} hp for similar ${y.year} models.` });
    else if (hp[1] <= peer.hp * 0.8) cons.push({ title: 'Modest power', detail: `Up to ${hp[1]} hp, versus about ${peer.hp} hp for similar ${y.year} models.` });
  }

  // choice
  const power = [y.fuels.includes('Hybrid') && 'hybrid', y.fuels.some((f) => /Plug-in/.test(f)) && 'plug-in hybrid', y.fuels.includes('EV') && !ev && 'electric'].filter(Boolean) as string[];
  if (power.length && !ev) pros.push({ title: `${power[0][0].toUpperCase()}${power[0].slice(1)} version available`, detail: `Offered as a ${list(power)} as well as gas.` });
  const awd = y.drives.some((d) => /4-Wheel|All-Wheel|4WD|AWD|Part-time/i.test(d));
  if (awd && y.drives.length > 1) pros.push({ title: 'AWD / 4WD available' });
  if (!awd && /SUV|pickup/.test(cls)) cons.push({ title: 'No AWD or 4WD', detail: `Two-wheel drive only, unusual for a ${cls}.` });
  if (y.specs?.seats && y.specs.seats[1] >= 7) pros.push({ title: `Seats up to ${y.specs.seats[1]}`, detail: y.specs.rows ? `${y.specs.rows} rows of seating.` : undefined });

  // safety
  if (y.overall === 5) pros.push({ title: '5-star NHTSA safety rating', detail: 'Top overall score in federal crash tests.' });
  else if (y.overall && y.overall <= 3) cons.push({ title: `${y.overall}-star NHTSA overall rating`, detail: 'Below the 4–5 stars most new cars earn.' });
  const risk = Math.max(0, ...(y.rating ?? []).map((r) => r.rolloverRisk ?? 0));
  if (risk >= 20) cons.push({ title: 'Higher rollover risk', detail: `NHTSA estimates a ${risk}% chance of rollover in a single-vehicle crash.` });
  const f = y.specs?.features ?? {};
  const std = KEY_TECH.filter((t) => f[t] === 'std');
  if (std.length >= 4) pros.push({ title: 'Lots of standard safety tech', detail: `${list(std)} standard on every version we checked.` });
  if (y.year >= 2019 && f['Automatic emergency braking'] && f['Automatic emergency braking'] !== 'std') cons.push({ title: 'Emergency braking not standard', detail: 'Automatic emergency braking is optional or limited to some trims.' });

  // reliability (complaints take a year or two to build up, and scale with sales — so only clear gaps are called out)
  const top = y.complaints.comps.filter(([c]) => !/UNKNOWN/i.test(c))[0];
  if (y.year <= now - 1 && peer?.complaints != null) {
    if (y.complaints.total >= 100 && y.complaints.total >= 3 * Math.max(peer.complaints, 10))
      cons.push({ title: 'Many owner complaints', detail: `${y.complaints.total.toLocaleString('en-US')} complaints filed with NHTSA versus about ${peer.complaints} for similar models${top ? ` — most often about the ${top[0].toLowerCase()}` : ''}.` });
    else if (y.year <= now - 2 && y.complaints.total <= peer.complaints * 0.35 && peer.complaints >= 20)
      pros.push({ title: 'Few owner complaints', detail: `${y.complaints.total} complaints filed with NHTSA versus about ${peer.complaints} for similar models.` });
  }
  const severe = recalls.filter((r) => r.doNotDrive || r.parkOutside);
  if (severe.length) cons.push({ title: severe.some((r) => r.doNotDrive) ? '"Do not drive" recall' : '"Park outside" recall', detail: 'Check that the recall repair was done before buying or driving.' });
  else if (recalls.length >= 5 && recalls.length >= 2 * Math.max(peer?.recalls ?? 0, 2)) cons.push({ title: `${recalls.length} recalls`, detail: `More than similar models (about ${peer?.recalls ?? 0}). Confirm repairs with the VIN.` });
  else if (!recalls.length && y.year <= now - 1) pros.push({ title: 'No recalls so far' });

  return { pros: pros.slice(0, 6), cons: cons.slice(0, 6) };
}
