// Problems pages (/make/model/problems): owner complaints and recalls across all model years of one model.
import { type Campaign, type Model, campaigns, title } from '@/lib/data';

export const MIN_COMPLAINTS = 50; // complaints filed since 2015, across all years, for a page of its own

const nice = (s: string) => title(s).replace(/:/g, ' › ').replace(/\bAnd\b/g, 'and');

export function problemsOf(m: Model) {
  const years = m.years.filter((y) => y.page).sort((a, b) => a.year - b.year);
  const total = years.reduce((s, y) => s + y.complaints.total, 0);
  const sum = (k: 'crash' | 'fire' | 'injured' | 'deaths') => years.reduce((s, y) => s + (y.complaints[k] ?? 0), 0);
  // components: each year's top reported areas, summed (the vague "unknown or other" bucket left out)
  const comps = new Map<string, { n: number; years: [number, number][] }>();
  for (const y of years)
    for (const [c, k] of y.complaints.comps) {
      if (/UNKNOWN OR OTHER/.test(c)) continue;
      const e = comps.get(c) ?? { n: 0, years: [] };
      e.n += k;
      e.years.push([y.year, k]);
      comps.set(c, e);
    }
  const top = [...comps]
    .map(([c, e]) => ({ name: nice(c), raw: c, n: e.n, worst: e.years.sort((a, b) => b[1] - a[1]).slice(0, 3) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const C = campaigns();
  const ids = [...new Set(years.flatMap((y) => y.recalls))];
  const recalls = ids
    .map((id) => C[id])
    .filter((c): c is Campaign => !!c)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .map((c) => ({ ...c, years: years.filter((y) => y.recalls.includes(c.id)).map((y) => y.year) }));
  const filed = years.filter((y) => y.complaints.total > 0);
  const worst = [...filed].sort((a, b) => b.complaints.total - a.complaints.total)[0];
  return { years, total, crash: sum('crash'), fire: sum('fire'), injured: sum('injured'), deaths: sum('deaths'), top, recalls, worst, filed: filed.length };
}

export const hasProblemsPage = (m: Model) => !m.thin && problemsOf(m).total >= MIN_COMPLAINTS && problemsOf(m).filed >= 3;
