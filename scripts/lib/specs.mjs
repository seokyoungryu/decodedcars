// Turns the vPIC decodes of one model year (one per VIN pattern ≈ one trim/engine configuration) into page data.
import { FEATURES } from './vinspecs.mjs';

const uniq = (a) => [...new Set(a.filter(Boolean))];
const title = (s) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
const DRIVE = [
  [/AWD|All-Wheel|4WD|4x4|4-Wheel/i, 'AWD/4WD'],
  [/FWD|Front-Wheel/i, 'FWD'],
  [/RWD|Rear-Wheel/i, 'RWD'],
];
const ELECTRIC = [
  [/BEV|Battery Electric/i, 'electric'],
  [/PHEV|Plug-in/i, 'plug-in hybrid'],
  [/Strong HEV|Hybrid Electric/i, 'hybrid'],
  [/Mild HEV/i, 'mild hybrid'],
  [/FCEV|Fuel Cell/i, 'fuel cell'],
];

function engineLabel(d) {
  const el = ELECTRIC.find(([re]) => re.test(d.ElectrificationLevel ?? ''))?.[1];
  if (el === 'electric') return 'Electric motor';
  const parts = [d.DisplacementL && `${Number(d.DisplacementL).toFixed(1)}L`, d.Turbo === 'Yes' && 'turbo', d.EngineCylinders && `${d.EngineCylinders}-cyl`, el].filter(Boolean);
  return parts.join(' ') || undefined;
}
const motorKw = (d) => Number((d.OtherEngineInfo ?? '').match(/(\d{2,3})\s*kW\s*\(Motor\)/i)?.[1]) || undefined;
function transLabel(d) {
  const t = d.TransmissionStyle ?? '';
  const sp = Number(d.TransmissionSpeeds) || undefined;
  if (/Continuously|CVT/i.test(t)) return /Electronic|e-CVT/i.test(t) ? 'e-CVT' : 'CVT';
  if (/Dual-Clutch|DCT/i.test(t)) return `${sp ? `${sp}-speed ` : ''}dual-clutch`;
  if (/Manual/i.test(t)) return `${sp ? `${sp}-speed ` : ''}manual`;
  if (/Automatic/i.test(t)) return `${sp ? `${sp}-speed ` : ''}automatic`;
  if (/Direct Drive/i.test(t)) return 'single-speed (direct drive)';
  return t || undefined;
}

/** decoded[] → { trims, engines, hp, trans, drive, seats, rows, features, led, plants } or undefined */
export function summarizeSpecs(decoded = []) {
  if (!decoded.length) return undefined;
  const engines = new Map();
  for (const d of decoded) {
    const label = engineLabel(d);
    if (!label) continue;
    const e = engines.get(label) ?? engines.set(label, { label, hp: [] , kw: [] }).get(label);
    if (Number(d.EngineHP) > 40) e.hp.push(Math.round(Number(d.EngineHP)));
    if (motorKw(d)) e.kw.push(motorKw(d));
  }
  const hpAll = decoded.map((d) => Math.round(Number(d.EngineHP))).filter((v) => v > 40);
  const seats = decoded.map((d) => Number(d.Seats)).filter((v) => v > 0 && v < 20);
  const features = {};
  for (const [field, label] of Object.entries(FEATURES)) {
    const vals = decoded.map((d) => d[field]).filter((v) => v === 'Standard' || v === 'Optional');
    if (!vals.length) continue;
    features[label] = vals.every((v) => v === 'Standard') ? 'std' : vals.some((v) => v === 'Standard') ? 'some' : 'opt';
  }
  return {
    n: decoded.length,
    trims: uniq(decoded.map((d) => d.Trim || d.Series)).slice(0, 12),
    engines: [...engines.values()].map((e) => ({ label: e.label, hp: e.hp.length ? [Math.min(...e.hp), Math.max(...e.hp)] : undefined, kw: e.kw.length ? Math.max(...e.kw) : undefined })),
    hp: hpAll.length ? [Math.min(...hpAll), Math.max(...hpAll)] : undefined,
    trans: uniq(decoded.map(transLabel)),
    drive: uniq(decoded.map((d) => DRIVE.find(([re]) => re.test(d.DriveType ?? ''))?.[1])),
    seats: seats.length ? [Math.min(...seats), Math.max(...seats)] : undefined,
    rows: Math.max(0, ...decoded.map((d) => Number(d.SeatRows) || 0)) || undefined,
    features: Object.keys(features).length ? features : undefined,
    led: decoded.some((d) => /LED/i.test(d.LowerBeamHeadlampLightSource ?? '')) || undefined,
    plants: uniq(decoded.map((d) => (d.PlantCity ? `${title(d.PlantCity)}, ${d.PlantState ? title(d.PlantState) : title(d.PlantCountry ?? '')}` : undefined))).slice(0, 4),
  };
}
