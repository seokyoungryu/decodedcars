# CarRadar (carradar)

English (US) car information site: specs, dimensions, fuel economy, safety ratings, photos and overviews for every U.S. car, truck and SUV since model year 2005 — with recalls and owner-reported problems as part of each model-year page.
Fully automatic: GitHub Actions collects, builds and deploys to Cloudflare Pages every day. Ad-supported (AdSense). No API keys needed for the data.

## Data sources and terms (checked 2026-10-27)

| Data | Source | Terms | Limits |
|---|---|---|---|
| Recalls | NHTSA ODI bulk file `FLAT_RCL_POST_2010.zip` (daily) | US Government work (17 U.S.C. §105) | none; conditional download |
| Owner complaints | NHTSA `COMPLAINTS_RECEIVED_*.zip` (daily) | Government compilation. **Narratives are owner-written; personal fields (city, partial VIN, operator name, dealer)** | we store only make/model/year/component/outcome counts/dates |
| Crash ratings | NHTSA NCAP API `api.nhtsa.gov/SafetyRatings` | US Government work | no published limit → slow, cached, ≤2,500 calls/day |
| Specs, MPG, EV range, fuel cost | EPA `vehicles.csv.zip` (fueleconomy.gov) | EPA Data License: public domain. **fueleconomy.gov photos are manufacturer-copyrighted, page text is non-commercial — use numbers only** | – |
| Dimensions, curb weight | Transport Canada Canadian Vehicle Specifications via NHTSA vPIC | **Open Government Licence – Canada: attribution required** (footer + under each dimensions table) | vPIC rate control → one call per make-year, 400 ms apart, cached 60 days for recent years |
| Model overview text | Wikipedia REST page summary | **CC BY-SA 4.0: shown unmodified, with article link and license** | cached 30 days |
| Model photo | Wikimedia Commons (the article's lead image, else another image of the article) | **Only free licenses (CC0/PD/CC BY/CC BY-SA); author, license and file link shown under the photo**; non-free enwiki images skipped | one Commons call per model, 1 s apart, cached 30 days |
| Fuel prices (calculator defaults) | fueleconomy.gov web service `/ws/rest/fuelprices` (EPA/DOE) | public domain, numbers only | one call per run |
| VIN decoding | NHTSA vPIC `DecodeVinValues`, called **from the visitor's browser** | US Government work; CORS open | the VIN never reaches our server and is not stored |
| Crash-test photos, safety tech | NHTSA NCAP | US Government work | part of the ratings calls |
| Trims, horsepower, transmissions, seats, driver-assist features (standard/optional), assembly plant | NHTSA vPIC `DecodeVinValuesExtended` on **VIN patterns** (chars 1–8 + `*` + year/plant chars) taken from the complaint file | US Government work. **The pattern drops the check digit and serial number, so it describes a factory configuration, never one vehicle; patterns stay in data/cache and are never published** | 2,500 patterns/run, 350 ms apart, cached forever (≈18k patterns → about a week to fill) |
| Trending / most researched | Wikimedia pageviews API | CC0; identifying User-Agent with contact required | gentle (one request per article per day) |
| Most viewed on CarRadar | Cloudflare Web Analytics GraphQL | our own data | 300 queries / 5 min (we use 1) |

## Compliance rules (read before changing)

- **Not a government site.** The disclaimer is on every page. No NHTSA, DOT or EPA logos or seals, and never "official".
- **VIN check.** Every model-year page says recalls apply to specific vehicles and links to nhtsa.gov/recalls for a VIN lookup.
- **No complaint narratives, no personal fields.** Only aggregated counts are kept. VIN *patterns* (no serial number) are cached only to look up specs and are never published.
- **Pros & cons are computed, not reviews.** They compare EPA/NHTSA/vPIC figures with the class average and rival model years, and the page says so. Third-party reviews and forum posts are not used (copyright / commercial-use terms).
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
scripts/lib/cvs.mjs          dimensions/weight (Transport Canada CVS via vPIC)
scripts/lib/wiki.mjs         Wikipedia article per model (checked, not an index page or older namesake) + free Commons photo per model
scripts/lib/photo-blocklist.json  Commons files rejected on manual review (interiors, race cars, wrong generation)
scripts/lib/vinspecs.mjs     vPIC decoding of VIN patterns (trims, HP, features), budgeted and cached
scripts/lib/specs.mjs        decoded patterns → per-year trims/engines/features summary
src/lib/proscons.ts          data-based pros & cons vs class average and rivals
scripts/lib/buyer.mjs        best/worst years, finder rows, head-to-head pairs, fuel prices → data/site
scripts/lib/analytics.mjs    Cloudflare Web Analytics (optional, after launch)
scripts/lib/aggregate.mjs    NHTSA→EPA name matching, comparisons, rankings, noindex list → data/site
src/pages/                   /, /makes, /[make], /[make]/[model], /[make]/[model]/[year], /recalls, /rankings/*, /guide/*,
                             /finder, /compare/*, /tools/vin-decoder, /tools/fuel-cost, /tools/car-loan, /tools/garage-fit
src/lib/changes.ts           model-year changes (engines, powertrains, AWD, size, MPG, NCAP) from our own data
src/lib/tools.ts             the tool list shown on the home page and /tools
```

Buyer features:
- **Best / worst year to buy** (model page): model years 2015 to two years ago; score = complaints + recalls×20 + crashes×3 + fires×10. A "year to avoid" is shown only when it is clearly worse (score ≥ 40 and ≥ 2× the best year). Counts are not adjusted for sales, which the page says.
- **Rivals** ("similar cars", comparison pages): same model year, body style (from all versions of the year — EPA files some crossovers as station wagons) and market tier (mainstream / luxury / exotic), exterior length within 10 in (or the same EPA size class when length is unknown), and cylinder count within 3. Comparison pages only for cars on sale this or last model year, at most 1,500.
- **What changed** (year page) and **changes by model year** (model page) compare each year with the previous one using EPA, CVS and NCAP data only. A body-length change of 2 in+ or wheelbase change of 1 in+ is flagged as a likely redesign. For next year's models (EPA list still filling in), nothing is reported as "dropped".
- **Car loan calculator** is pure math in the browser; the APR is an editable example, not a market rate.
- **Garage fit** uses CVS length/width/height of the largest body style from the newest year that has dimensions; widths exclude mirrors (+9 in assumed at the door).
- **Photos** are reviewed by eye after changes to the photo rules (contact sheets of every photo); bad files, photo series and models without a correct photo go into `photo-blocklist.json`. Once chosen, a model's photo is kept on later re-checks (so reviewed photos don't silently change) unless it is blocklisted.

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

- Horsepower/torque: no free official dataset found (EPA and NCAP don't publish it).
- Choosing a final brand name and domain ("CarRadar" is a working name).
- More buyer tools: lease calculator, recall RSS per model.

## Design

Editorial automotive style: self-hosted variable fonts (Archivo for headings, Inter for text; both SIL OFL, no third-party font requests), near-black header/footer/hero bands, one orange accent, light and dark themes from `prefers-color-scheme`. All tokens are at the top of `src/styles/global.css`.
