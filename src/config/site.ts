export const SITE_NAME = 'CarRadar';
export const SITE_TAGLINE = 'Recalls, complaints, MPG and safety ratings for every car';
export const SITE_DESCRIPTION =
  'Check recalls, owner complaints, fuel economy, specs and crash-test ratings for any car, truck or SUV since 2005 — updated daily from NHTSA and EPA public data.';

/** Contact email for the About page (fill in before applying to AdSense) */
export const CONTACT_EMAIL = '';

/** Set to 'ca-pub-…' after AdSense approval: turns on the ad script, ad slots and ads.txt */
export const ADSENSE_CLIENT = '';
/** Display ad unit IDs (data-ad-slot). Empty = Auto ads only */
export const ADSENSE_SLOTS = { content: '', bottom: '' };

/** Shown on every page: not a government site, and VIN lookup is the only way to confirm an open recall */
export const NOTICE =
  'CarRadar is an independent site and is not affiliated with or endorsed by NHTSA, the EPA, the U.S. Department of Transportation, or any vehicle manufacturer. Recalls apply to specific vehicles — always confirm with your 17-character VIN at nhtsa.gov/recalls or with a dealer.';

export const VIN_LOOKUP = 'https://www.nhtsa.gov/recalls';
export const campaignUrl = (id: string) => `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(id)}`;
