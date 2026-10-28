// Data-based pros & cons for a model year: EPA, NHTSA and vPIC figures compared with the class average and with
// rival model years (same year, body style, market tier and size). Our own comparison — not owner or press reviews.
import type { Campaign, Model, Year } from '@/lib/data';
import type { Lang } from '@/i18n';
import { classNounL, compL, featureL } from '@/i18n/terms';

export interface Point {
  title: string;
  detail?: string;
}
const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100);
const list = (lang: Lang, a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} ${lang === 'es' ? 'y' : 'and'} ${a.at(-1)}`);
const KEY_TECH = ['Automatic emergency braking', 'Blind-spot monitoring', 'Adaptive cruise control', 'Lane keeping assist', 'Rear cross-traffic alert'];

export function prosCons(m: Model, y: Year, recalls: Campaign[], lang: Lang = 'en'): { pros: Point[]; cons: Point[] } {
  const es = lang === 'es';
  const pros: Point[] = [];
  const cons: Point[] = [];
  const now = new Date().getUTCFullYear();
  const cls = classNounL(lang, y.cls);
  const peer = y.peer;
  const nf = (x: number) => x.toLocaleString(es ? 'es-US' : 'en-US');
  const ev = y.fuels.includes('EV') && !y.fuels.some((f) => /Gasoline|Diesel|Hybrid/.test(f));
  const similar = es ? `modelos similares ${y.year}` : `similar ${y.year} models`;

  // efficiency
  if (!ev && y.mpg && y.classAvg) {
    const d = pct(y.mpg.max, y.classAvg);
    if (d >= 15)
      pros.push(es
        ? { title: 'Excelente consumo de combustible', detail: `Hasta ${y.mpg.max} MPG combinadas: un ${d} % mejor que el promedio de su clase (${cls}, ${y.year}: ${y.classAvg} MPG).` }
        : { title: 'Excellent fuel economy', detail: `Up to ${y.mpg.max} MPG combined — ${d}% better than the average ${y.year} ${cls} (${y.classAvg} MPG).` });
    else if (d <= -12)
      cons.push(es
        ? { title: 'Consumo por debajo del promedio', detail: `Su versión más eficiente logra ${y.mpg.max} MPG combinadas, un ${-d} % menos que el promedio de su clase (${cls}, ${y.year}: ${y.classAvg} MPG).` }
        : { title: 'Below-average fuel economy', detail: `Best version gets ${y.mpg.max} MPG combined, ${-d}% below the ${y.year} ${cls} average of ${y.classAvg} MPG.` });
  }
  if (y.range) {
    if (y.range >= 300) pros.push(es ? { title: 'Gran autonomía eléctrica', detail: `Hasta ${y.range} millas por carga (EPA).` } : { title: 'Long EV range', detail: `Up to ${y.range} miles on a charge (EPA).` });
    else if (y.range < 200 && ev) cons.push(es ? { title: 'Autonomía eléctrica corta', detail: `Hasta ${y.range} millas por carga (EPA): habrá que planificar la recarga.` } : { title: 'Short EV range', detail: `Up to ${y.range} miles on a charge (EPA) — plan around charging.` });
  }
  const gas = y.variants.filter((v) => v.comb && v.type !== 'EV');
  if (gas.length && gas.every((v) => /premium/i.test(v.fuel ?? '')))
    cons.push(es ? { title: 'Requiere gasolina premium', detail: 'Todas las versiones de gasolina usan premium, lo que encarece el uso diario.' } : { title: 'Premium fuel required', detail: 'Every gasoline version is rated for premium, which raises running costs.' });

  // performance
  const hp = y.specs?.hp;
  if (hp && peer?.hp) {
    if (hp[1] >= peer.hp * 1.25) pros.push(es ? { title: 'Buen desempeño', detail: `Hasta ${hp[1]} hp, frente a unos ${peer.hp} hp de ${similar}.` } : { title: 'Strong performance', detail: `Up to ${hp[1]} hp, versus about ${peer.hp} hp for ${similar}.` });
    else if (hp[1] <= peer.hp * 0.8) cons.push(es ? { title: 'Potencia modesta', detail: `Hasta ${hp[1]} hp, frente a unos ${peer.hp} hp de ${similar}.` } : { title: 'Modest power', detail: `Up to ${hp[1]} hp, versus about ${peer.hp} hp for ${similar}.` });
  }

  // choice
  const P: [boolean, string, string][] = [
    [y.fuels.includes('Hybrid'), 'hybrid', 'híbrida'],
    [y.fuels.some((f) => /Plug-in/.test(f)), 'plug-in hybrid', 'híbrida enchufable'],
    [y.fuels.includes('EV') && !ev, 'electric', 'eléctrica'],
  ];
  const power = P.filter(([on]) => on).map(([, en, sp]) => (es ? sp : en));
  if (power.length && !ev)
    pros.push(es ? { title: `Disponible en versión ${power[0]}`, detail: `Se ofrece en versión ${list(lang, power)} además de gasolina.` } : { title: `${power[0][0].toUpperCase()}${power[0].slice(1)} version available`, detail: `Offered as a ${list(lang, power)} as well as gas.` });
  const awd = y.drives.some((d) => /4-Wheel|All-Wheel|4WD|AWD|Part-time/i.test(d));
  if (awd && y.drives.length > 1) pros.push({ title: es ? 'Tracción total / 4x4 disponible' : 'AWD / 4WD available' });
  if (!awd && /SUV|pickup/.test(classNounL('en', y.cls))) cons.push(es ? { title: 'Sin tracción total ni 4x4', detail: `Solo tracción en dos ruedas, algo poco común en ${cls === 'vehículo' ? 'su clase' : `un ${cls}`}.` } : { title: 'No AWD or 4WD', detail: `Two-wheel drive only, unusual for a ${cls}.` });
  if (y.specs?.seats && y.specs.seats[1] >= 7)
    pros.push(es ? { title: `Hasta ${y.specs.seats[1]} asientos`, detail: y.specs.rows ? `${y.specs.rows} filas de asientos.` : undefined } : { title: `Seats up to ${y.specs.seats[1]}`, detail: y.specs.rows ? `${y.specs.rows} rows of seating.` : undefined });

  // safety
  if (y.overall === 5) pros.push(es ? { title: '5 estrellas en seguridad NHTSA', detail: 'La máxima calificación general en las pruebas de choque federales.' } : { title: '5-star NHTSA safety rating', detail: 'Top overall score in federal crash tests.' });
  else if (y.overall && y.overall <= 3) cons.push(es ? { title: `${y.overall} estrellas en la calificación NHTSA`, detail: 'Por debajo de las 4–5 estrellas que obtiene la mayoría de los autos nuevos.' } : { title: `${y.overall}-star NHTSA overall rating`, detail: 'Below the 4–5 stars most new cars earn.' });
  const risk = Math.max(0, ...(y.rating ?? []).map((r) => r.rolloverRisk ?? 0));
  if (risk >= 20) cons.push(es ? { title: 'Mayor riesgo de volcadura', detail: `La NHTSA estima un ${risk} % de probabilidad de volcadura en un choque de un solo vehículo.` } : { title: 'Higher rollover risk', detail: `NHTSA estimates a ${risk}% chance of rollover in a single-vehicle crash.` });
  const f = y.specs?.features ?? {};
  const std = KEY_TECH.filter((t) => f[t] === 'std');
  if (std.length >= 4)
    pros.push(es ? { title: 'Mucha tecnología de seguridad de serie', detail: `${list(lang, std.map((t) => featureL(lang, t)))} de serie en todas las versiones revisadas.` } : { title: 'Lots of standard safety tech', detail: `${list(lang, std)} standard on every version we checked.` });
  if (y.year >= 2019 && f['Automatic emergency braking'] && f['Automatic emergency braking'] !== 'std')
    cons.push(es ? { title: 'Frenado de emergencia no es de serie', detail: 'El frenado automático de emergencia es opcional o solo está en algunas versiones.' } : { title: 'Emergency braking not standard', detail: 'Automatic emergency braking is optional or limited to some trims.' });

  // reliability (complaints take a year or two to build up, and scale with sales — so only clear gaps are called out)
  const top = y.complaints.comps.filter(([c]) => !/UNKNOWN/i.test(c))[0];
  if (y.year <= now - 1 && peer?.complaints != null) {
    if (y.complaints.total >= 100 && y.complaints.total >= 3 * Math.max(peer.complaints, 10))
      cons.push(es
        ? { title: 'Muchas quejas de propietarios', detail: `${nf(y.complaints.total)} quejas ante la NHTSA frente a unas ${peer.complaints} de modelos similares${top ? `; sobre todo por problemas de ${compL(lang, top[0]).toLowerCase()}` : ''}.` }
        : { title: 'Many owner complaints', detail: `${nf(y.complaints.total)} complaints filed with NHTSA versus about ${peer.complaints} for similar models${top ? ` — most often about the ${top[0].toLowerCase()}` : ''}.` });
    else if (y.year <= now - 2 && y.complaints.total <= peer.complaints * 0.35 && peer.complaints >= 20)
      pros.push(es ? { title: 'Pocas quejas de propietarios', detail: `${y.complaints.total} quejas ante la NHTSA frente a unas ${peer.complaints} de modelos similares.` } : { title: 'Few owner complaints', detail: `${y.complaints.total} complaints filed with NHTSA versus about ${peer.complaints} for similar models.` });
  }
  const severe = recalls.filter((r) => r.doNotDrive || r.parkOutside);
  if (severe.length) {
    const dnd = severe.some((r) => r.doNotDrive);
    cons.push(es ? { title: dnd ? 'Retiro con aviso de "no conducir"' : 'Retiro con aviso de "estacionar afuera"', detail: 'Verifica que la reparación del retiro esté hecha antes de comprarlo o manejarlo.' } : { title: dnd ? '"Do not drive" recall' : '"Park outside" recall', detail: 'Check that the recall repair was done before buying or driving.' });
  } else if (recalls.length >= 5 && recalls.length >= 2 * Math.max(peer?.recalls ?? 0, 2))
    cons.push(es ? { title: `${recalls.length} retiros`, detail: `Más que modelos similares (unos ${peer?.recalls ?? 0}). Confirma las reparaciones con el VIN.` } : { title: `${recalls.length} recalls`, detail: `More than similar models (about ${peer?.recalls ?? 0}). Confirm repairs with the VIN.` });
  else if (!recalls.length && y.year <= now - 1) pros.push({ title: es ? 'Sin retiros hasta ahora' : 'No recalls so far' });

  return { pros: pros.slice(0, 6), cons: cons.slice(0, 6) };
}
