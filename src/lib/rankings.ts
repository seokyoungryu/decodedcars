// Ranking pages: each is a list from data/site/rankings.json plus our own explanation of how it is computed.
import { n, rankings, usd } from '@/lib/data';

type Row = Record<string, unknown> & { make: string; model: string; makeSlug: string; slug: string; year?: number; latest?: number };
export interface RankDef {
  slug: string;
  title: string;
  short: string;
  intro: string;
  /** how to read this list — our own advice, shown under the read-out */
  how?: string;
  rows: () => Row[];
  value: (r: Row) => string;
  yearLink: boolean;
}
const R = () => rankings();

export const RANKINGS: RankDef[] = [
  {
    slug: 'trending',
    how: "Use it to spot what everyone is suddenly looking at — then check the model page for recalls and complaints before you get caught up in the buzz. A jump in interest is not a recommendation. Interest usually fades within a few weeks, so treat this as a news feed rather than a buying guide. Click through to a model to see whether the attention follows a recall, a redesign or simply a new model year. Models need at least 2,000 views a week to qualify, which keeps tiny swings in rarely read articles off the list. The list is recalculated every morning.",
    title: 'Trending cars this week',
    short: 'Trending',
    intro: 'Models whose English Wikipedia article views grew the most this week compared with last week (minimum 2,000 weekly views). Spikes often follow a new model reveal, a big recall, a price change or news coverage.',
    rows: () => R().trending as Row[],
    value: (r) => `${(r.change as number) > 0 ? '+' : ''}${r.change}% · ${n(r.week as number)} views`,
    yearLink: false,
  },
  {
    slug: 'popular',
    how: "These are the cars most shoppers are comparing, which makes them good benchmarks: if you are considering a less common model, compare it with the leader in its class here. Wikipedia views are a free, public signal; they track curiosity, not how many cars were sold. The same list in your own price range is easy to build in the car finder.",
    title: 'Most researched cars',
    short: 'Most researched',
    intro: 'The models people read about most, by English Wikipedia article views over the last 30 days — a rough signal of public interest, not of sales.',
    rows: () => R().popular as Row[],
    value: (r) => `${n(r.views30 as number)} views / 30 days`,
    yearLink: false,
  },
  {
    slug: 'most-complaints',
    how: "A sudden rise in complaints can be the first sign of a problem that later becomes a recall. Open the model page to see which systems owners report and which model years are affected. Check the date of each complaint on the model page: a burst of recent reports matters more than an old total.",
    title: 'Cars with the most new complaints',
    short: 'Most new complaints',
    intro: 'Models (all model years combined) with the most safety complaints filed with NHTSA in the last 90 days. Popular cars naturally collect more reports, so use this to spot emerging problems rather than to rank reliability.',
    rows: () => R().complaints90 as Row[],
    value: (r) => `${n(r.recent90 as number)} complaints / 90 days`,
    yearLink: false,
  },
  {
    slug: 'best-mpg',
    how: "Plug-in hybrids are ranked on their gasoline MPG and fully electric cars are left out, because MPGe is not comparable. Check the fuel cost calculator to see what the gap means for your own mileage.",
    title: 'Best fuel economy',
    short: 'Best MPG',
    intro: 'Highest EPA combined MPG among gasoline, hybrid and plug-in hybrid models of the latest model year (plug-ins rated on gasoline). Electric cars are ranked by range instead.',
    rows: () => R().bestMpg as Row[],
    value: (r) => `${r.mpg} MPG · ${r.cls ?? ''}`,
    yearLink: true,
  },
  {
    slug: 'longest-range',
    how: "EPA range is measured on a mix of city and highway driving; expect less at highway speeds and in cold weather. Charging speed and access matter as much as the headline number.",
    title: 'Longest-range electric cars',
    short: 'Longest EV range',
    intro: 'EPA-rated driving range of the latest model-year electric vehicles (best version of each model). Real-world range drops in cold weather and at highway speeds.',
    rows: () => R().longestRange as Row[],
    value: (r) => `${r.range} miles · ${r.cls ?? ''}`,
    yearLink: true,
  },
  {
    slug: 'cheapest-to-fuel',
    how: "Yearly fuel cost is the EPA estimate for 15,000 miles at national average prices, so it already reflects whether a car needs premium fuel. Your local prices can change the order.",
    title: 'Cheapest cars to fuel',
    short: 'Cheapest to fuel',
    intro: "Lowest EPA estimated annual fuel or electricity cost (15,000 miles a year at current national prices) for the latest model year. A quick way to compare running costs across gas, hybrid and electric.",
    rows: () => R().cheapestFuel as Row[],
    value: (r) => `${usd(r.cost as number)} / year · ${r.cls ?? ''}`,
    yearLink: true,
  },
  {
    slug: 'safest',
    how: "Only models tested under the current NHTSA program (2011 and later) can appear here. Five stars overall is a strong start — also look at rollover risk and which driver-assist features are standard. Ratings are per model year, so a used car from an earlier generation may not share the same stars. Use the car finder to combine five stars with the body style and fuel economy you need.",
    title: '5-star overall safety ratings',
    short: '5-star safety',
    intro: "Recent model years that earned NHTSA's top 5-star overall crash rating, newest first and then by fewest recall campaigns.",
    rows: () => R().safest as Row[],
    value: (r) => `5★ · ${r.recalls} recall${r.recalls === 1 ? '' : 's'}`,
    yearLink: true,
  },
  {
    slug: 'new-models',
    how: "New model years appear here as soon as the EPA lists them, often months before they reach dealers. Early in the year the data can be incomplete, so check back as more versions are added. Prices, trims and safety ratings for brand-new models usually follow later in the year.",
    title: 'Newly added models',
    short: 'New models',
    intro: 'Model years that appeared in the EPA fuel economy database in the last 90 days — usually brand-new models or the next model year arriving at dealers.',
    rows: () => R().newModels as Row[],
    value: (r) => (r.range ? `${r.range} mi range` : r.mpg ? `${r.mpg} MPG` : `added ${r.added}`),
    yearLink: true,
  },
];
