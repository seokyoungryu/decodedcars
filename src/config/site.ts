export const SITE_NAME = 'DecodedCars';
export const SITE_TAGLINE = 'Specs, MPG, safety ratings and recalls for every car';
export const SITE_DESCRIPTION =
  'Specs, dimensions, fuel economy, crash-test ratings, recalls and owner-reported problems for every car, truck and SUV since 2005 — compared year by year and updated daily.';

/** Contact email for the About page (fill in before applying to AdSense) */
export const CONTACT_EMAIL = 'hello@decodedcars.com';

/** Publisher ID (same account as the other sites): adds the site-verification tag, the AdSense script and ads.txt.
 *  Ad units stay off until ADSENSE_SLOTS are filled in after approval. */
export const ADSENSE_CLIENT = 'ca-pub-6097529637653954';
/** Display ad unit IDs (data-ad-slot). Empty = Auto ads only */
export const ADSENSE_SLOTS = { content: '', bottom: '' };

/** Shown on every page: not a government site, and VIN lookup is the only way to confirm an open recall */
export const NOTICE =
  'DecodedCars is an independent site and is not affiliated with or endorsed by NHTSA, the EPA, the U.S. Department of Transportation, or any vehicle manufacturer. Recalls apply to specific vehicles — always confirm with your 17-character VIN at nhtsa.gov/recalls or with a dealer.';

export const VIN_LOOKUP = 'https://www.nhtsa.gov/recalls';
export const campaignUrl = (id: string) => `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(id)}`;
