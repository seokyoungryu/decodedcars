// "Most viewed on this site" from Cloudflare Web Analytics (our own visitors), via the GraphQL Analytics API.
// Optional: skipped until the site is live and CF_ANALYTICS_TOKEN + CF_ACCOUNT_ID + CF_SITE_TAG are set.
// One query per run (limit is 300 queries / 5 min).
export async function collectSiteViews(log) {
  const { CF_ANALYTICS_TOKEN: token, CF_ACCOUNT_ID: account, CF_SITE_TAG: site } = process.env;
  if (!token || !account || !site) {
    log('Site analytics: skipped (no Cloudflare analytics token yet)');
    return {};
  }
  const since = new Date(Date.now() - 7 * 86400e3).toISOString();
  const query = `query($account: String!, $site: String!, $since: Time!) {
    viewer { accounts(filter: { accountTag: $account }) {
      rumPageloadEventsAdaptiveGroups(limit: 500, orderBy: [count_DESC], filter: { siteTag: $site, datetime_geq: $since }) {
        count dimensions { requestPath }
      } } } }`;
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { account, site, since } }),
  });
  const j = await res.json();
  const rows = j?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
  if (j.errors?.length) log(`  analytics: ${j.errors[0].message}`);
  const out = Object.fromEntries(rows.map((r) => [r.dimensions.requestPath.replace(/\.html$/, '').replace(/\/$/, ''), r.count]));
  log(`Site analytics: ${rows.length} paths (7 days)`);
  return out;
}
