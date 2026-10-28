// Spanish labels for data values: EPA classes, fuels, drivetrains, transmissions, NHTSA components, vPIC features.
// English input is returned unchanged for lang 'en'; unknown values fall back to the English original.
import type { Lang } from '@/i18n';

const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());

/** EPA class → short noun: "Small Sport Utility Vehicle 4WD" → "small SUV" / "SUV pequeño" */
export function classNounL(lang: Lang, cls?: string): string {
  const s = (cls ?? '').toLowerCase().replace(/ [24]wd/g, '');
  if (lang === 'en') {
    if (!s) return 'vehicle';
    return s.replace(/sport utility vehicles?/, 'SUV').replace(/pickup trucks?/, 'pickup truck').replace(/\bcars$/, 'car').replace(/\bwagons$/, 'wagon').replace(/\bminivan.*$/, 'minivan').replace(/\bvans?(,.*)?$/, 'van').replace(/vehicles$/, 'vehicle').trim();
  }
  if (!s) return 'vehículo';
  const size = /minicompact/.test(s) ? 'minicompacto' : /subcompact/.test(s) ? 'subcompacto' : /compact/.test(s) ? 'compacto' : /midsize/.test(s) ? 'mediano' : /large|standard/.test(s) ? 'grande' : /small/.test(s) ? 'pequeño' : '';
  if (/sport utility/.test(s)) return `SUV ${size}`.trim();
  if (/pickup/.test(s)) return `pickup ${size === 'pequeño' ? 'pequeña' : size === 'mediano' ? 'mediana' : size}`.trim();
  if (/minivan/.test(s)) return 'minivan';
  if (/van/.test(s)) return 'van';
  if (/wagon/.test(s)) return `familiar ${size}`.trim();
  if (/two seater/.test(s)) return 'deportivo biplaza';
  if (/special purpose/.test(s)) return 'vehículo de uso especial';
  if (/car/.test(s)) return `auto ${size}`.trim();
  return cls ?? 'vehículo';
}
/** "a"/"an"/"un" + noun for sentences */
export const aNoun = (lang: Lang, cls?: string) => {
  const w = classNounL(lang, cls);
  if (lang === 'es') return `${/^(pickup|van|minivan)/.test(w) ? 'una' : 'un'} ${w}`;
  return `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
};
/** Full EPA class for tables: "Small Sport Utility Vehicle 2WD" → "SUV pequeño (2WD)" */
export function classL(lang: Lang, cls?: string) {
  if (!cls || lang === 'en') return cls ?? '–';
  const wd = cls.match(/\b([24]WD)\b/)?.[1];
  const w = classNounL(lang, cls);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}${wd ? ` (${wd})` : ''}`;
}

const FUEL: Record<string, string> = {
  'Regular Gasoline': 'Gasolina regular', 'Premium Gasoline': 'Gasolina premium', 'Midgrade Gasoline': 'Gasolina intermedia', Diesel: 'Diésel',
  Hybrid: 'Híbrido', EV: 'Eléctrico', 'Plug-in Hybrid': 'Híbrido enchufable', eFCV: 'Celda de combustible (hidrógeno)', CNG: 'GNC',
  'Gasoline or E85': 'Gasolina o E85', 'Premium or E85': 'Premium o E85', 'Gasoline or natural gas': 'Gasolina o gas natural', Electricity: 'Electricidad',
};
export const fuelL = (lang: Lang, f: string) => (lang === 'es' ? FUEL[f] ?? f : f);

const DRIVE: [RegExp, string][] = [
  [/part-time 4-wheel/i, '4x4 conectable'], [/4-wheel|4wd|4x4/i, 'Tracción 4x4'], [/all-wheel|awd/i, 'Tracción total (AWD)'],
  [/front-wheel|fwd/i, 'Tracción delantera'], [/rear-wheel|rwd/i, 'Tracción trasera'], [/2-wheel/i, 'Tracción en 2 ruedas'],
];
export const driveL = (lang: Lang, d: string) => (lang === 'es' ? DRIVE.find(([re]) => re.test(d))?.[1] ?? d : d);

/** "2.0L 4-cyl turbo" → "2.0L 4 cil. turbo"; "hybrid" → "híbrido" */
export const engineL = (lang: Lang, e: string) =>
  lang === 'es' ? e.replace(/(\d+)-cyl/g, '$1 cil.').replace(/\bhybrid\b/g, 'híbrido').replace(/\bplug-in híbrido\b/g, 'híbrido enchufable').replace(/\bmild híbrido\b/g, 'híbrido ligero').replace(/^Electric motor$/, 'Motor eléctrico').replace(/\bfuel cell\b/, 'celda de combustible') : e;

/** EPA "Automatic (S8)" / vPIC labels → Spanish */
export const transL = (lang: Lang, t: string) =>
  lang === 'es'
    ? t
        .replace(/Automatic/i, 'Automática').replace(/Manual/i, 'Manual').replace(/variable gear ratios/i, 'relación variable')
        .replace(/(\d+)-speed automatic/i, 'automática de $1 vel.').replace(/(\d+)-speed manual/i, 'manual de $1 vel.').replace(/(\d+)-speed dual-clutch/i, 'doble embrague de $1 vel.')
        .replace(/^automatic$/i, 'automática').replace(/^dual-clutch$/i, 'doble embrague').replace(/single-speed \(direct drive\)/i, 'una velocidad (directa)')
    : t;

const COMP: Record<string, string> = {
  ENGINE: 'Motor', 'ENGINE AND ENGINE COOLING': 'Motor y refrigeración', 'ENGINE COOLING': 'Refrigeración del motor', 'ELECTRICAL SYSTEM': 'Sistema eléctrico',
  'POWER TRAIN': 'Tren motriz', STEERING: 'Dirección', 'SERVICE BRAKES': 'Frenos', 'SERVICE BRAKES, HYDRAULIC': 'Frenos hidráulicos', 'SERVICE BRAKES, AIR': 'Frenos de aire',
  'AIR BAGS': 'Bolsas de aire', STRUCTURE: 'Estructura', SUSPENSION: 'Suspensión', 'FUEL/PROPULSION SYSTEM': 'Combustible / propulsión', 'FUEL SYSTEM, GASOLINE': 'Combustible (gasolina)',
  'FUEL SYSTEM, DIESEL': 'Combustible (diésel)', 'FUEL SYSTEM, OTHER': 'Combustible (otro)', VISIBILITY: 'Visibilidad', 'SEAT BELTS': 'Cinturones de seguridad', SEATS: 'Asientos',
  'EXTERIOR LIGHTING': 'Iluminación exterior', WHEELS: 'Ruedas', TIRES: 'Neumáticos', 'VEHICLE SPEED CONTROL': 'Control de velocidad', 'FORWARD COLLISION AVOIDANCE': 'Prevención de colisión frontal',
  'LANE DEPARTURE': 'Salida de carril', 'BACK OVER PREVENTION': 'Prevención de impacto en reversa', 'LATCHES/LOCKS/LINKAGES': 'Cerraduras y seguros', 'ELECTRONIC STABILITY CONTROL (ESC)': 'Control de estabilidad (ESC)',
  'ELECTRONIC STABILITY CONTROL': 'Control de estabilidad', 'UNKNOWN OR OTHER': 'Otro o desconocido', 'HYBRID PROPULSION SYSTEM': 'Propulsión híbrida', 'PARKING BRAKE': 'Freno de estacionamiento',
  'TRAILER HITCHES': 'Enganche de remolque', EQUIPMENT: 'Equipamiento', COMMUNICATION: 'Comunicación', 'CHILD SEAT': 'Silla infantil', 'AIR CONDITIONING': 'Aire acondicionado',
  'ADAPTIVE CRUISE CONTROL': 'Control de crucero adaptativo', 'TRACTION CONTROL SYSTEM': 'Control de tracción', 'ADAPTIVE EQUIPMENT': 'Equipamiento adaptado', 'BODY': 'Carrocería',
  'WINDOWS/WINDSHIELD': 'Ventanas / parabrisas', 'INTERIOR LIGHTING': 'Iluminación interior', 'HEATER': 'Calefacción', 'WIPERS': 'Limpiaparabrisas', 'TRANSMISSION': 'Transmisión',
  'AUTOMATIC TRANSMISSION': 'Transmisión automática', 'MANUAL TRANSMISSION': 'Transmisión manual', 'POWER TRAIN:AUTOMATIC TRANSMISSION': 'Tren motriz › Transmisión automática',
};
/** NHTSA component "ENGINE:COOLING" → "Engine › Cooling" / "Motor › Refrigeración" */
export const compL = (lang: Lang, s?: string) => {
  if (!s) return '–';
  return s
    .split(':')
    .map((p) => {
      const k = p.trim().toUpperCase();
      return lang === 'es' ? COMP[k] ?? titleCase(p.trim()) : titleCase(p.trim());
    })
    .join(' › ');
};

const FEATURE: Record<string, string> = {
  'Automatic emergency braking': 'Frenado automático de emergencia', 'Pedestrian emergency braking': 'Frenado de emergencia con detección de peatones',
  'Forward collision warning': 'Alerta de colisión frontal', 'Blind-spot monitoring': 'Monitor de punto ciego', 'Blind-spot intervention': 'Intervención en punto ciego',
  'Rear cross-traffic alert': 'Alerta de tráfico cruzado trasero', 'Rear automatic braking': 'Frenado automático en reversa', 'Lane departure warning': 'Alerta de salida de carril',
  'Lane keeping assist': 'Asistente de mantenimiento de carril', 'Lane centering': 'Centrado en el carril', 'Adaptive cruise control': 'Control de crucero adaptativo',
  'Parking assist': 'Asistente de estacionamiento', 'Backup camera': 'Cámara de reversa', 'Automatic high beams': 'Luces altas automáticas', 'Adaptive driving beam': 'Luces adaptativas',
  'Keyless start': 'Arranque sin llave', 'LED headlights': 'Faros LED', 'Electronic stability control': 'Control electrónico de estabilidad',
};
export const featureL = (lang: Lang, f: string) => (lang === 'es' ? FEATURE[f] ?? f : f);

/** NCAP "Standard" / "Optional" / "Not Available" */
export const availL = (lang: Lang, v: string) => (lang === 'es' ? ({ Standard: 'De serie', Optional: 'Opcional', 'Not Available': 'No disponible' } as Record<string, string>)[v] ?? v : v);
