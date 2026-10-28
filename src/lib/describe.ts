// Plain-English summary written from the data (our own text, so every page has an original overview
// that pulls the numbers together instead of only repeating government tables).
import type { Model, Year } from '@/lib/data';
import { aNoun, classNounL, compL, driveL, engineL } from '@/i18n/terms';

/** "CIVIC 5DR HATCH" → "5dr Hatch" (model name removed, normal capitalization) */
export const bodyName = (name: string, model: string) =>
  name
    .replace(new RegExp(`^${model.replace(/[^A-Za-z0-9 ]/g, '.')}\\s*`, 'i'), '')
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Awd|Fwd|Rwd|4x4|2wd|4wd|Lx|Ex|Dx|Si|Gt|Rs|Ss|Ev|Suv|Phev|Hev)\b/g, (w) => w.toUpperCase())
    .replace(/(\d)Dr\b/g, '$1dr')
    .trim() || name;

const list = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);

/** EPA class "Midsize Cars" / "Small Sport Utility Vehicle 4WD" → "midsize car" / "small SUV" */
export const classNoun = (s?: string) =>
  s
    ? s
        .toLowerCase()
        .replace(/ [24]wd/g, '')
        .replace(/sport utility vehicles?/, 'SUV')
        .replace(/pickup trucks?/, 'pickup truck')
        .replace(/\bcars$/, 'car')
        .replace(/\bwagons$/, 'wagon')
        .replace(/\bminivan.*$/, 'minivan')
        .replace(/\bvans?(,.*)?$/, 'van')
        .replace(/vehicles$/, 'vehicle')
        .trim()
    : 'vehicle';
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function describeYear(m: Model, y: Year): string[] {
  const name = `${y.year} ${m.make} ${m.model}`;
  const out: string[] = [];
  const ev = y.fuels.includes('EV');
  const hybrid = y.fuels.some((f) => /Hybrid/.test(f));
  const engines = y.engines.slice(0, 4);
  const cls = classNoun(y.cls);

  // what it is
  let s = `The ${name} is ${/^[aeiou]/i.test(cls) ? 'an' : 'a'} ${cls}`;
  if (ev && !y.engines.length) s += ' powered by electricity';
  else if (engines.length === 1) s += ` offered with a ${engines[0]} engine`;
  else if (engines.length) s += ` offered with ${engines.length} engines (${list(engines)})`;
  if (hybrid) s += ', including a hybrid version';
  if (y.drives.length) s += ` and ${list(y.drives.map((d) => d.toLowerCase()))}`;
  out.push(s + '.');

  // size
  const d = y.dims.find((x) => x.length && x.weight);
  if (d)
    out.push(
      `It measures about ${Math.round(d.length!)} inches long${d.width ? ` and ${Math.round(d.width)} inches wide` : ''}${d.wheelbase ? ` on a ${Math.round(d.wheelbase)}-inch wheelbase` : ''}, with a curb weight of roughly ${Math.round(d.weight!).toLocaleString('en-US')} lb${y.dims.length > 1 ? ` (${bodyName(d.name, m.model)})` : ''}.`,
    );

  // efficiency
  if (y.mpg) {
    const vs = y.classAvg ? Math.round((y.mpg.max / y.classAvg - 1) * 100) : undefined;
    out.push(
      `EPA rates its most efficient version at ${y.mpg.max} MPG combined (${y.mpg.city} city / ${y.mpg.hwy} highway)${vs !== undefined ? `, ${Math.abs(vs)}% ${vs >= 0 ? 'better' : 'worse'} than the ${y.year} ${cls} average of ${y.classAvg} MPG` : ''}${y.cost ? `, for an estimated $${y.cost.toLocaleString('en-US')} a year in fuel` : ''}.`,
    );
  }
  if (y.range) out.push(`The electric version has an EPA-rated range of up to ${y.range} miles${y.charge ? ` and takes about ${y.charge} hours to charge on a 240-volt Level 2 charger` : ''}.`);

  // safety
  if (y.overall) out.push(`In NHTSA crash testing it earned ${y.overall === 5 ? 'the top' : 'a'} ${y.overall}-star overall rating.`);
  else if (y.year >= 2011 && y.year < new Date().getUTCFullYear()) out.push('NHTSA has not published a 5-Star overall rating for this model year.');

  // problems
  const r = y.recalls.length;
  const c = y.complaints.total;
  if (r || c) {
    const top = y.complaints.comps[0]?.[0];
    out.push(`It has ${plural(r, 'recall campaign')} on file${c ? ` and owners have filed ${plural(c, 'complaint')} with NHTSA since 2015${top ? `, most often about the ${top.toLowerCase().split(/[:,]/)[0]}` : ''}` : ''}.`);
  } else out.push('There are no recalls or owner complaints on file with NHTSA for this model year.');
  return out;
}

/** Spanish version of describeYear — same facts, written in natural U.S. Spanish */
export function describeYearEs(m: Model, y: Year): string[] {
  const name = `${m.make} ${m.model} ${y.year}`;
  const out: string[] = [];
  const ev = y.fuels.includes('EV');
  const hybrid = y.fuels.some((f) => /Hybrid/.test(f));
  const engines = y.engines.slice(0, 4).map((e) => engineL('es', e));
  const listEs = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} y ${a.at(-1)}`);

  let s = `El ${name} es ${aNoun('es', y.cls)}`;
  if (ev && !y.engines.length) s += ' 100 % eléctrico';
  else if (engines.length === 1) s += ` con motor ${engines[0]}`;
  else if (engines.length) s += ` disponible con ${engines.length} motores (${listEs(engines)})`;
  if (hybrid) s += ', incluida una versión híbrida';
  if (y.drives.length) s += `, con ${listEs(y.drives.map((d) => driveL('es', d).toLowerCase().replace('(awd)', '(AWD)')))}`;
  out.push(s + '.');

  const d = y.dims.find((x) => x.length && x.weight);
  if (d)
    out.push(
      `Mide unas ${Math.round(d.length!)} pulgadas de largo${d.width ? ` y ${Math.round(d.width)} de ancho` : ''}${d.wheelbase ? `, con una distancia entre ejes de ${Math.round(d.wheelbase)} pulgadas` : ''}, y pesa alrededor de ${Math.round(d.weight!).toLocaleString('es-US')} lb${y.dims.length > 1 ? ` (${bodyName(d.name, m.model)})` : ''}.`,
    );

  if (y.mpg) {
    const vs = y.classAvg ? Math.round((y.mpg.max / y.classAvg - 1) * 100) : undefined;
    out.push(
      `La EPA califica su versión más eficiente con ${y.mpg.max} MPG combinadas (${y.mpg.city} en ciudad / ${y.mpg.hwy} en carretera)${vs !== undefined ? `, un ${Math.abs(vs)} % ${vs >= 0 ? 'mejor' : 'peor'} que el promedio de su clase (${classNounL('es', y.cls)}, ${y.year}: ${y.classAvg} MPG)` : ''}${y.cost ? `, con un gasto estimado de $${y.cost.toLocaleString('es-US')} al año en combustible` : ''}.`,
    );
  }
  if (y.range) out.push(`La versión eléctrica tiene una autonomía EPA de hasta ${y.range} millas${y.charge ? ` y tarda unas ${y.charge} horas en cargarse con un cargador de nivel 2 (240 V)` : ''}.`);

  if (y.overall) out.push(`En las pruebas de choque de la NHTSA obtuvo ${y.overall === 5 ? 'la máxima calificación general de' : 'una calificación general de'} ${y.overall} estrellas.`);
  else if (y.year >= 2011 && y.year < new Date().getUTCFullYear()) out.push('La NHTSA no ha publicado una calificación general de 5 estrellas para este año modelo.');

  const r = y.recalls.length;
  const c = y.complaints.total;
  if (r || c) {
    const top = y.complaints.comps[0]?.[0];
    out.push(`Tiene ${r} ${r === 1 ? 'campaña de retiro' : 'campañas de retiro'} registradas${c ? ` y los propietarios han presentado ${c.toLocaleString('es-US')} ${c === 1 ? 'queja' : 'quejas'} ante la NHTSA desde 2015${top ? `, sobre todo por problemas de ${compL('es', top.split(/[:,]/)[0]).toLowerCase()}` : ''}` : ''}.`);
  } else out.push('No hay retiros ni quejas de propietarios registrados en la NHTSA para este año modelo.');
  return out;
}
