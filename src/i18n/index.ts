// Languages: English at the root, Spanish (U.S.) under /es. Same data, our own sentences translated by hand;
// government text (recall summaries) stays in its official English and is labeled so.
export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['en', 'es'];
export const pre = (lang: Lang) => (lang === 'es' ? '/es' : '');
const locale = (lang: Lang) => (lang === 'es' ? 'es-US' : 'en-US');

export const num = (lang: Lang, x?: number) => (x == null ? '–' : x.toLocaleString(locale(lang)));
export const money = (lang: Lang, x?: number) => (x == null ? '–' : `$${x.toLocaleString(locale(lang))}`);
export const day = (lang: Lang, d?: string) =>
  d ? new Date(d + 'T00:00:00Z').toLocaleDateString(locale(lang), { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '–';

/** "/honda/cr-v" → "/es/honda/cr-v" */
export const to = (lang: Lang, path: string) => `${pre(lang)}${path === '/' && lang === 'es' ? '' : path}` || '/';

/** Words shared by many pages */
export const UI = {
  en: {
    finder: 'Car finder', compare: 'Compare', makes: 'Makes', rankings: 'Rankings', tools: 'Tools', recalls: 'Recalls', guides: 'Guides',
    about: 'About', terms: 'Terms & disclaimer', privacy: 'Privacy', contact: 'Contact', vinCheck: 'Check your VIN at NHTSA ↗',
    research: 'Research', site: 'Site', allMakes: 'All makes', newRecalls: 'New recalls', compareCars: 'Compare cars',
    ad: 'Advertisement', notRated: 'Not rated', photo: 'Photo', pictured: 'Pictured', via: 'via Wikimedia Commons',
    langName: 'English', switchTo: 'Español', switchLabel: 'Ver en español',
    tagline: 'Specs, MPG, safety ratings and recalls for every car',
    footerAbout: 'Independent data from the EPA, NHTSA and Transport Canada, updated every day.',
    notice: 'DecodedCars is an independent site and is not affiliated with or endorsed by NHTSA, the EPA, the U.S. Department of Transportation, or any vehicle manufacturer. Recalls apply to specific vehicles — always confirm with your 17-character VIN at nhtsa.gov/recalls or with a dealer.',
    dataNote: 'Data: EPA fuel economy data; NHTSA recalls, consumer complaints and NCAP ratings; Transport Canada Canadian Vehicle Specifications — contains information licensed under the Open Government Licence – Canada; Wikipedia text (CC BY-SA 4.0), Wikimedia Commons photos (license shown under each photo) and pageview statistics (CC0). MPG figures are EPA estimates; your results will vary.',
    vinTool: 'VIN decoder', fuelTool: 'Fuel cost calculator', loanTool: 'Car loan calculator', garageTool: 'Garage fit',
  },
  es: {
    finder: 'Buscador', compare: 'Comparar', makes: 'Marcas', rankings: 'Rankings', tools: 'Herramientas', recalls: 'Retiros', guides: 'Guías',
    about: 'Acerca de', terms: 'Términos y aviso legal', privacy: 'Privacidad', contact: 'Contacto', vinCheck: 'Consulta tu VIN en NHTSA (en inglés) ↗',
    research: 'Investigar', site: 'Sitio', allMakes: 'Todas las marcas', newRecalls: 'Retiros nuevos', compareCars: 'Comparar autos',
    ad: 'Publicidad', notRated: 'Sin calificar', photo: 'Foto', pictured: 'En la foto', via: 'vía Wikimedia Commons',
    langName: 'Español', switchTo: 'English', switchLabel: 'View in English',
    tagline: 'Ficha técnica, consumo, seguridad y retiros de cada auto',
    footerAbout: 'Datos independientes de la EPA, la NHTSA y Transport Canada, actualizados a diario.',
    notice: 'DecodedCars es un sitio independiente y no está afiliado ni respaldado por la NHTSA, la EPA, el Departamento de Transporte de EE. UU. ni ningún fabricante. Los retiros (recalls) aplican a vehículos específicos: confirma siempre con tu VIN de 17 caracteres en nhtsa.gov/recalls o con un concesionario.',
    dataNote: 'Datos: rendimiento de combustible de la EPA; retiros, quejas de consumidores y calificaciones NCAP de la NHTSA; Canadian Vehicle Specifications de Transport Canada — contiene información con licencia Open Government Licence – Canada; textos de Wikipedia (CC BY-SA 4.0), fotos de Wikimedia Commons (licencia indicada en cada foto) y estadísticas de visitas (CC0). Las cifras de MPG son estimaciones de la EPA; tus resultados pueden variar.',
    vinTool: 'Decodificador de VIN', fuelTool: 'Costo de combustible', loanTool: 'Calculadora de préstamo', garageTool: '¿Cabe en tu garaje?',
  },
} as const;
