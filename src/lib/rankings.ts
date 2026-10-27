// Ranking pages: each is a list from data/site/rankings.json plus our own explanation of how it is computed.
import { n, rankings, usd } from '@/lib/data';

type Row = Record<string, unknown> & { make: string; model: string; makeSlug: string; slug: string; year?: number; latest?: number };
export interface RankDef {
  slug: string;
  title: string;
  short: string;
  intro: string;
  rows: () => Row[];
  value: (r: Row) => string;
  yearLink: boolean;
}
const R = () => rankings();

export const RANKINGS: RankDef[] = [
  {
    slug: 'trending',
    title: 'Trending cars this week',
    short: 'Trending',
    intro: 'Models whose English Wikipedia article views grew the most this week compared with last week (minimum 2,000 weekly views). Spikes often follow a new model reveal, a big recall, a price change or news coverage.',
    rows: () => R().trending as Row[],
    value: (r) => `${(r.change as number) > 0 ? '+' : ''}${r.change}% · ${n(r.week as number)} views`,
    yearLink: false,
  },
  {
    slug: 'popular',
    title: 'Most researched cars',
    short: 'Most researched',
    intro: 'The models people read about most, by English Wikipedia article views over the last 30 days — a rough signal of public interest, not of sales.',
    rows: () => R().popular as Row[],
    value: (r) => `${n(r.views30 as number)} views / 30 days`,
    yearLink: false,
  },
  {
    slug: 'most-complaints',
    title: 'Cars with the most new complaints',
    short: 'Most new complaints',
    intro: 'Models (all model years combined) with the most safety complaints filed with NHTSA in the last 90 days. Popular cars naturally collect more reports, so use this to spot emerging problems rather than to rank reliability.',
    rows: () => R().complaints90 as Row[],
    value: (r) => `${n(r.recent90 as number)} complaints / 90 days`,
    yearLink: false,
  },
  {
    slug: 'best-mpg',
    title: 'Best fuel economy',
    short: 'Best MPG',
    intro: 'Highest EPA combined MPG among gasoline, hybrid and plug-in hybrid models of the latest model year (plug-ins rated on gasoline). Electric cars are ranked by range instead.',
    rows: () => R().bestMpg as Row[],
    value: (r) => `${r.mpg} MPG · ${r.cls ?? ''}`,
    yearLink: true,
  },
  {
    slug: 'longest-range',
    title: 'Longest-range electric cars',
    short: 'Longest EV range',
    intro: 'EPA-rated driving range of the latest model-year electric vehicles (best version of each model). Real-world range drops in cold weather and at highway speeds.',
    rows: () => R().longestRange as Row[],
    value: (r) => `${r.range} miles · ${r.cls ?? ''}`,
    yearLink: true,
  },
  {
    slug: 'cheapest-to-fuel',
    title: 'Cheapest cars to fuel',
    short: 'Cheapest to fuel',
    intro: "Lowest EPA estimated annual fuel or electricity cost (15,000 miles a year at current national prices) for the latest model year. A quick way to compare running costs across gas, hybrid and electric.",
    rows: () => R().cheapestFuel as Row[],
    value: (r) => `${usd(r.cost as number)} / year · ${r.cls ?? ''}`,
    yearLink: true,
  },
  {
    slug: 'safest',
    title: '5-star overall safety ratings',
    short: '5-star safety',
    intro: "Recent model years that earned NHTSA's top 5-star overall crash rating, newest first and then by fewest recall campaigns.",
    rows: () => R().safest as Row[],
    value: (r) => `5★ · ${r.recalls} recall${r.recalls === 1 ? '' : 's'}`,
    yearLink: true,
  },
  {
    slug: 'new-models',
    title: 'Newly added models',
    short: 'New models',
    intro: 'Model years that appeared in the EPA fuel economy database in the last 90 days — usually brand-new models or the next model year arriving at dealers.',
    rows: () => R().newModels as Row[],
    value: (r) => (r.range ? `${r.range} mi range` : r.mpg ? `${r.mpg} MPG` : `added ${r.added}`),
    yearLink: true,
  },
];
