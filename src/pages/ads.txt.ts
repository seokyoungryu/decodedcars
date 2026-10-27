// ads.txt for AdSense; filled in automatically once ADSENSE_CLIENT is set
import { ADSENSE_CLIENT } from '@/config/site';

export function GET() {
  const body = ADSENSE_CLIENT ? `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n` : '# ADSENSE_CLIENT not set\n';
  return new Response(body, { headers: { 'content-type': 'text/plain' } });
}
