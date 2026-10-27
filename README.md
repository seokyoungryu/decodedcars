# CarRadar (carradar)

English (US) site: recalls, owner complaints, EPA fuel economy/specs, NHTSA crash ratings and popularity rankings for every U.S. car, truck and SUV since model year 2005.
Fully automatic: GitHub Actions collects, builds and deploys to Cloudflare Pages every day. Ad-supported (AdSense). No API keys needed for the data.

## Data sources and terms (checked 2026-10-27)

| Data | Source | Terms | Limits |
|---|---|---|---|
| Recalls | NHTSA ODI bulk file `FLAT_RCL_POST_2010.zip` (daily) | US Government work (17 U.S.C. §105) | none; conditional download |
| Owner complaints | NHTSA `COMPLAINTS_RECEIVED_*.zip` (daily) | Government compilation. **Narratives are owner-written; personal fields (city, partial VIN, operator name, dealer)** | we store only make/model/year/component/outcome counts/dates |
| Crash ratings | NHTSA NCAP API `api.nhtsa.gov/SafetyRatings` | US Government work | no published limit → slow, cached, ≤2,500 calls/day |
| Specs, MPG, EV range, fuel cost | EPA `vehicles.csv.zip` (fueleconomy.gov) | EPA Data License: public domain. **fueleconomy.gov photos are manufacturer-copyrighted, page text is non-commercial — use numbers only** | – |
| Trending / most researched | Wikimedia pageviews API | CC0; identifying User-Agent with contact required | gentle (one request per article per day) |
| Most viewed on CarRadar | Cloudflare Web Analytics GraphQL | our own data | 300 queries / 5 min (we use 1) |

## Compliance rules (read before changing)

- **Not a government site.** The disclaimer is on every page. No NHTSA, DOT or EPA logos or seals, and never "official".
- **VIN check.** Every model-year page says recalls apply to specific vehicles and links to nhtsa.gov/recalls for a VIN lookup.
- **No complaint narratives, no personal fields.** Only aggregated counts are kept.
- **No thin pages** (Google scaled-content policy, AdSense low-value content):
  - Each model-year page adds class-average MPG comparison, year-over-year tables, problem areas and a monthly trend.
  - Model-years with no recalls, fewer than 3 complaints and no rating are `noindex` and left out of the sitemap.
  - At most 15,000 model-year pages (Cloudflare's 20k-file limit).
- **Ads** are labeled "Advertisement" and never placed next to navigation or the VIN button.
- **Fuel-cell (FCV) and EV figures are kept out of MPG comparisons**, because MPGe is not comparable with gasoline MPG.

## How it works

```
scripts/collect.mjs          daily entry point (each step can fail without stopping the others)
scripts/lib/epa.mjs          EPA file → the model universe (make + baseModel + year ≥ 2005)
scripts/lib/nhtsa-files.mjs  recalls + complaints bulk files, streamed (300 MB+)
scripts/lib/ratings.mjs      NCAP API, cached; missing years first, current years refreshed every 30 days
scripts/lib/pageviews.mjs    Wikipedia title resolution (cached) + 60-day daily views
scripts/lib/analytics.mjs    Cloudflare Web Analytics (optional, after launch)
scripts/lib/aggregate.mjs    NHTSA→EPA name matching, comparisons, rankings, noindex list → data/site
src/pages/                   /, /makes, /[make], /[make]/[model], /[make]/[model]/[year], /recalls, /rankings/*, /guide/*
```

Names are matched with a normalized key (`F-150` = `F150`, `CR-V` = `CRV`). If a NHTSA model has no exact EPA match, it falls back to the longest EPA model name it starts with (`SILVERADO 1500` → `Silverado`). Display names and URLs use NHTSA's punctuation (`/ford/f-150`).

`data/` is never committed. The workflow keeps `data/cache` in the Actions cache and deploys `dist` directly with wrangler.
It also commits a one-line heartbeat on the 1st of each month: GitHub disables scheduled workflows in public repos after 60 days without activity.

## First-time setup

1. **GitHub:** create a **public** repository (Actions minutes are free for public repos; a run takes 10–20 minutes) and push.
2. **Cloudflare Pages:** Workers & Pages → Create → Pages → "Upload assets" → create a project named `carradar` (direct upload, not Git-connected).
3. **API token:** create a Cloudflare API token with Account › Cloudflare Pages › Edit and Account › Account Analytics › Read.
4. **Repository secrets:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `SITE_CONTACT`, a URL or email, which goes into our User-Agent as Wikimedia requires
5. **First run:** Actions → **Daily update** → Run workflow. Safety ratings fill in over about two daily runs.
6. **Domain:** after connecting one, update `src/config/site-url.mjs` and `public/robots.txt`.
7. **After launch:**
   - Enable Cloudflare Web Analytics for the site and add its site tag as the secret `CF_SITE_TAG`. This turns on "most viewed on CarRadar".
   - Add the site to Google Search Console and submit `/sitemap-index.xml`.
8. **Before AdSense:** set `CONTACT_EMAIL` in `src/config/site.ts`, and consider adding a few more guides (`src/content/guides`).
9. **After approval:**
   - Set `ADSENSE_CLIENT`.
   - In AdSense → Privacy & messaging, turn on the GDPR consent message for EEA/UK/CH visitors. The privacy page already says one is shown.

## Commands

```bash
npm install
npm run collect                                       # full run (~5–10 min locally; downloads ~250 MB the first time)
node scripts/collect.mjs --ratings=100                # fewer rating API calls
node scripts/collect.mjs --skip=ratings,pageviews     # quick re-aggregate from cache
npm run build && npm run preview
```

## Ideas not done yet

- Car photos from Wikimedia Commons, with a per-image license and attribution check.
- Choosing a final brand name and domain ("CarRadar" is a working name).
