// Joining NHTSA (UPPERCASE free text) and EPA (title case, baseModel) needs one shared key.
//   "MERCEDES-BENZ" / "Mercedes-Benz" → MERCEDESBENZ
//   "F-150" / "F150"                  → F150
//   "CR-V" / "CR-V"                   → CRV
export const norm = (s) =>
  String(s ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

export const key = (make, model) => `${norm(make)}|${norm(model)}`;

/** URL slug: "Mercedes-Benz" → mercedes-benz, "F150" → f150, "CX-5" → cx-5 */
export const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// NHTSA and EPA disagree on a few make names
const MAKE_ALIAS = { CHEVY: 'CHEVROLET', VW: 'VOLKSWAGEN', MERCEDES: 'MERCEDESBENZ', LANDROVER: 'LANDROVER', MINICOOPER: 'MINI' };
export const makeKey = (m) => MAKE_ALIAS[norm(m)] ?? norm(m);

/** Minimal RFC 4180 CSV line splitter (EPA file has quoted fields with commas) */
export function splitCsv(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') out.push(cur), (cur = '');
    else cur += c;
  }
  out.push(cur);
  return out;
}
