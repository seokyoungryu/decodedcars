// One row per model (latest model year) for the car finder, VIN lookup and fuel-cost calculator
import { finder, fuelPrices } from '@/lib/data';

export function GET() {
  return new Response(JSON.stringify({ prices: fuelPrices(), rows: finder() }), { headers: { 'content-type': 'application/json' } });
}
