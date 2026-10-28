// What changed from one model year to the next, worked out from EPA versions, Transport Canada dimensions and NCAP
// ratings. Our own comparison of the data — no press-release text. Only differences the data can show are reported.
import type { Model, Year } from '@/lib/data';
import type { Lang } from '@/i18n';
import { engineL } from '@/i18n/terms';

const POWER: Record<string, [string, string]> = {
  Hybrid: ['hybrid', 'híbrida'], 'Plug-in Hybrid': ['plug-in hybrid', 'híbrida enchufable'], EV: ['all-electric', '100 % eléctrica'],
  eFCV: ['hydrogen fuel-cell', 'de hidrógeno (celda de combustible)'], Diesel: ['diesel', 'diésel'],
};
const powertrains = (y: Year, lang: Lang) => new Set(y.fuels.map((f) => POWER[f]?.[lang === 'es' ? 1 : 0]).filter(Boolean) as string[]);
const AWD = /4-Wheel|All-Wheel|4WD|AWD|Part-time/i;
const len = (y: Year) => y.dims.find((d) => d.length)?.length;
const wb = (y: Year) => y.dims.find((d) => d.wheelbase)?.wheelbase;
const weight = (y: Year) => Math.min(...y.dims.map((d) => d.weight ?? Infinity));
const list = (lang: Lang, a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} ${lang === 'es' ? 'y' : 'and'} ${a.at(-1)}`);
const diff = <T,>(a: Set<T>, b: Set<T>) => [...a].filter((x) => !b.has(x));

export interface Change {
  text: string;
  /** body dimensions changed: most likely a new generation or a redesign */
  redesign?: boolean;
}

/** Differences between the previous model year `p` and year `y` (empty when nothing measurable changed) */
export function changesBetween(p: Year, y: Year, lang: Lang = 'en'): Change[] {
  const es = lang === 'es';
  const out: Change[] = [];
  // next year's EPA list fills in over months, so "no longer offered" can't be trusted yet
  const partial = y.year > new Date().getUTCFullYear();
  const lp = len(p), ly = len(y), wp = wb(p), wy = wb(y);
  if ((lp && ly && Math.abs(ly - lp) >= 2) || (wp && wy && Math.abs(wy - wp) >= 1)) {
    const dl = lp && ly && lp !== ly ? Math.abs(ly - lp).toFixed(1) : '';
    const dw = wp && wy && Math.abs(wy - wp) >= 1 ? `${wy > wp ? '+' : '−'}${Math.abs(wy - wp).toFixed(1)}` : '';
    out.push({
      redesign: true,
      text: es
        ? `Nuevas dimensiones${dl ? `: ${dl} in más ${ly! > lp! ? 'largo' : 'corto'}` : ''}${dw ? `, distancia entre ejes ${dw} in` : ''} — probablemente un rediseño o nueva generación`
        : `New body dimensions${dl ? `: ${dl} in ${ly! > lp! ? 'longer' : 'shorter'}` : ''}${dw ? `, wheelbase ${dw} in` : ''} — most likely a redesign or new generation`,
    });
  }
  const pp = powertrains(p, lang), py = powertrains(y, lang);
  const newP = diff(py, pp), goneP = diff(pp, py);
  if (newP.length) out.push({ text: es ? `Nueva versión ${list(lang, newP)}` : `New ${list(lang, newP)} version${newP.length > 1 ? 's' : ''}` });
  if (goneP.length && !partial) out.push({ text: es ? `Ya no hay versión ${list(lang, goneP)}` : `No ${list(lang, goneP)} version any more` });
  const ep = new Set(p.engines), ey = new Set(y.engines);
  const newE = diff(ey, ep).map((e) => engineL(lang, e)), goneE = diff(ep, ey).map((e) => engineL(lang, e));
  if (newE.length && ey.size) out.push({ text: es ? `${newE.length > 1 ? 'Motores nuevos' : 'Motor nuevo'}: ${list(lang, newE)}` : `Engine${newE.length > 1 ? 's' : ''} added: ${list(lang, newE)}` });
  if (goneE.length && ey.size && !partial) out.push({ text: es ? `${goneE.length > 1 ? 'Motores retirados' : 'Motor retirado'}: ${list(lang, goneE)}` : `Engine${goneE.length > 1 ? 's' : ''} dropped: ${list(lang, goneE)}` });
  const awdP = p.drives.some((d) => AWD.test(d)), awdY = y.drives.some((d) => AWD.test(d));
  if (awdY && !awdP) out.push({ text: es ? 'Ahora disponible con tracción total o 4x4' : 'All-wheel or four-wheel drive now available' });
  if (awdP && !awdY && y.drives.length && !partial) out.push({ text: es ? 'Ya no se ofrece tracción total / 4x4' : 'All-wheel / four-wheel drive no longer offered' });
  if (p.mpg && y.mpg && !(partial && y.mpg.max < p.mpg.max) && Math.abs(y.mpg.max - p.mpg.max) >= 2)
    out.push({ text: es ? `Mejor consumo combinado ${y.mpg.max > p.mpg.max ? 'sube' : 'baja'} de ${p.mpg.max} a ${y.mpg.max} MPG` : `Best combined MPG ${y.mpg.max > p.mpg.max ? 'up' : 'down'} from ${p.mpg.max} to ${y.mpg.max}` });
  if (p.range && y.range && Math.abs(y.range - p.range) >= 10)
    out.push({ text: es ? `Autonomía eléctrica máxima ${y.range > p.range ? 'sube' : 'baja'} de ${p.range} a ${y.range} millas` : `Longest EV range ${y.range > p.range ? 'up' : 'down'} from ${p.range} to ${y.range} miles` });
  const gp = weight(p), gy = weight(y);
  if (isFinite(gp) && isFinite(gy) && Math.abs(gy - gp) >= 150 && !out.some((c) => c.redesign))
    out.push({ text: es ? `La versión más ligera pesa ${Math.round(Math.abs(gy - gp))} lb ${gy > gp ? 'más' : 'menos'}` : `Lightest version ${Math.round(Math.abs(gy - gp))} lb ${gy > gp ? 'heavier' : 'lighter'}` });
  if (p.overall && y.overall && p.overall !== y.overall)
    out.push({ text: es ? `Calificación general NHTSA ${y.overall > p.overall ? 'sube' : 'baja'} de ${p.overall} a ${y.overall} estrellas` : `NHTSA overall rating ${y.overall > p.overall ? 'up' : 'down'} from ${p.overall} to ${y.overall} stars` });
  if (!p.overall && y.overall) out.push({ text: es ? `Ya probado por la NHTSA: ${y.overall} estrellas en general` : `Now crash-tested by NHTSA: ${y.overall} stars overall` });
  return out;
}

/** The model year before `y` that has EPA data (not necessarily its own page) */
export const previousYear = (m: Model, y: Year) => m.years.find((x) => x.year < y.year && x.variants.length);

/** Year-by-year change log for the model page, newest first: only years where something changed */
export const changeLog = (m: Model, lang: Lang = 'en') =>
  m.years
    .filter((y) => y.variants.length)
    .map((y) => {
      const p = previousYear(m, y);
      return { year: y.year, page: y.page, prev: p?.year, changes: p ? changesBetween(p, y, lang) : [] };
    })
    .filter((x) => x.changes.length);
