#!/usr/bin/env node
// 애드센스 신청 전 점검: npm run build 다음에 npm run check:adsense
// DecodedCars용 (CityFluent에서 이식, 영어+스페인어 단어 수). FreeConvertter가 "가치가 별로 없는 콘텐츠"로 거절된 원인(빈약한 페이지·카테고리 페이지, 같은 틀 반복, 짧은 소개·문의, 너무 새 사이트)과
// "준비 중" 페이지를 빌드 결과(dist/)에서 숫자로 확인한다. ✗가 하나라도 있으면 신청하지 않는다.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const OUT = 'dist';
if (!existsSync(OUT)) {
  console.log('✗ dist/ 폴더가 없습니다. 먼저 npm run build');
  process.exit(1);
}

// 신청 기준
const LAUNCH = process.env.SITE_LAUNCH || '2026-10-28'; // decodedcars.com went live 2026-10-28 (first deploy)
const MIN_SITE_DAYS = 28;
const THIN = 300; // 본문 영어 단어 수가 이보다 적으면 빈약한 페이지
const ABOUT_MIN = 400;
const POLICY_MIN = 250;
const REPEAT_PAGES = 5; // 같은 문단이 이 수 이상의 페이지에 나오면 '틀 반복'

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) files.push(p);
  }
})(OUT);

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&[a-z]+;|&#\d+;/g, ' ');
const mainHtml = (html) => /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? html;
const mainText = (html) =>
  decode(
    mainHtml(html)
      .replace(/<(script|style|nav)\b[\s\S]*?<\/\1>/g, ' ')
      .replace(/<[^>]+>/g, '\n'),
  ).replace(/[ \t]+/g, ' ');
const paragraphs = (html) =>
  [...mainHtml(html).replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').matchAll(/<(p|li|dd)\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .filter((x) => !/^\s*<a\b[^>]*>[\s\S]*?<\/a>\s*$/.test(x[2]))
    .map((x) => decode(x[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim())
    .filter((t) => t.length >= 60);
const words = (text) => text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;

let fail = 0;
let warn = 0;
const bad = (msg) => {
  fail++;
  console.log(`✗ ${msg}`);
};
const note = (msg) => {
  warn++;
  console.log(`△ ${msg}`);
};

const pages = [];
for (const file of files) {
  let url = '/' + relative(OUT, file).split(sep).join('/').replace(/\.html$/, '');
  url = url === '/index' ? '/' : url.replace(/\/index$/, '');
  if (url === '/404') continue;
  const html = readFileSync(file, 'utf8');
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
  const canonical = /<link rel="canonical" href="https?:\/\/[^/"]+([^"]*)"/.exec(html)?.[1] ?? null;
  if (canonical === null) bad(`대표 주소(canonical)가 없음: ${url}`);
  else if ((canonical || '/') !== url) bad(`대표 주소가 자기 주소가 아님: ${url} → ${canonical}`);
  const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] || '');
  const desc = decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] || '');
  if (!desc) bad(`설명(meta description)이 없음: ${url}`);
  // keep full HTML only where later checks need it (14k pages would not fit in memory)
  const text = mainText(html);
  const keep = ['/', '/es', '/privacy', '/es/privacy'].includes(url) || /class="adsbygoogle/.test(html);
  pages.push({ url, html: keep ? html : '', title, desc, n: words(text), paras: paragraphs(html), wip: (/coming soon|under construction|lorem ipsum|próximamente|en construcción/i.exec(text) ?? /\bTODO\b/.exec(text))?.[0] });
}
console.log(`검사한 페이지 ${pages.length}개 (noindex 제외)`);

// 1. 빈약한 페이지 (카테고리·도구 페이지 포함)
const POLICY = /^(\/es)?\/(privacy|terms|contact|methodology)$/;
const ABOUT = /^(\/es)?\/about$/;
const thin = [];
for (const p of pages) {
  const min = ABOUT.test(p.url) ? ABOUT_MIN : POLICY.test(p.url) ? POLICY_MIN : THIN;
  if (p.n < min) thin.push([p, min]);
}
console.log(`\n[빈약한 페이지] ${thin.length}개`);
for (const [p, min] of thin.sort((a, b) => a[0].n - b[0].n)) bad(`${p.url.padEnd(48)} ${String(p.n).padStart(5)}단어 (기준 ${min})`);

// 2. 같은 틀 반복
const seen = new Map();
for (const p of pages) for (const t of new Set(p.paras)) (seen.get(t) ?? seen.set(t, []).get(t)).push(p.url);
const repeated = [...seen].filter(([, urls]) => urls.length >= REPEAT_PAGES).sort((a, b) => b[1].length - a[1].length);
console.log(`\n[${REPEAT_PAGES}곳 이상에 똑같이 나오는 문단] ${repeated.length}개`);
for (const [t, urls] of repeated.slice(0, 25)) {
  const msg = `${urls.length}곳 (예: ${urls[0]}): "${t.slice(0, 70)}…"`;
  t.length >= 160 ? bad(msg) : note(msg);
}

// 3. 제목·설명 중복
for (const key of ['title', 'desc']) {
  const by = new Map();
  for (const p of pages) (by.get(p[key]) ?? by.set(p[key], []).get(p[key])).push(p.url);
  for (const [v, urls] of by) if (v && urls.length > 1) bad(`${key === 'title' ? '제목' : '설명'}이 같은 페이지 ${urls.length}개: ${urls.slice(0, 3).join(', ')} ("${v.slice(0, 40)}")`);
}

// 4. "준비 중" 흔적 (공사 중 사이트로 보이면 거절 사유)
console.log('\n[준비 중 흔적]');
for (const p of pages) {
  if (p.wip) bad(`${p.url}: "${p.wip}" 문구가 보임`);
}

// 5. 사이트 나이
console.log('\n[사이트 나이]');
if (!LAUNCH) bad('공개일(SITE_LAUNCH)이 없음: 아직 배포 전이면 신청할 수 없음');
else {
  const days = Math.floor((Date.now() - Date.parse(`${LAUNCH}T00:00:00+09:00`)) / 864e5);
  const ageMsg = `공개 ${LAUNCH} → ${days}일 지남 / 기준 ${MIN_SITE_DAYS}일`;
  days >= MIN_SITE_DAYS ? console.log(`  ${ageMsg}`) : bad(ageMsg);
}

// 6. 정책 페이지·광고 설정·기본 파일
console.log('\n[정책·광고 설정]');
for (const path of ['/about', '/contact', '/privacy', '/terms', '/es/about', '/es/contact', '/es/privacy', '/es/terms']) {
  if (!pages.some((p) => p.url === path)) bad(`필수 페이지 없음: ${path}`);
}
const contactHtml = readFileSync(join(OUT, 'contact.html'), 'utf8');
if (!/href="mailto:/.test(contactHtml)) bad('/contact에 연락처 이메일이 없음 (src/config/site.ts의 CONTACT_EMAIL)');
const privacy = pages.find((p) => p.url === '/privacy')?.html || '';
if (!/adssettings\.google\.com/.test(privacy)) bad('/privacy에 구글 맞춤 광고 끄는 방법(adssettings)이 없음');
const adsTxt = join(OUT, 'ads.txt');
if (!existsSync(adsTxt) || !/google\.com, pub-\d+, DIRECT/.test(readFileSync(adsTxt, 'utf8'))) bad('ads.txt에 게시자 줄이 없음');
if (!existsSync(join(OUT, 'robots.txt'))) bad('robots.txt가 없음');
if (!existsSync(join(OUT, 'sitemap-index.xml'))) bad('sitemap-index.xml이 없음');
const home = pages.find((p) => p.url === '/')?.html || '';
if (!/google-adsense-account/.test(home)) bad('홈에 애드센스 사이트 확인 태그가 없음');
const og = /<meta property="og:image" content="https?:\/\/[^/"]+([^"]*)"/.exec(home)?.[1];
if (og && !existsSync(join(OUT, og))) bad(`공유 이미지가 없음: ${og}`);
for (const p of pages) if (/class="adsbygoogle/.test(p.html) && p.url.startsWith('/kit/')) note(`${p.url}: 도구 화면에 광고 자리 (버튼 근처면 실수 클릭 위험)`);

console.log(`\n✗ ${fail}개 · △ ${warn}개  →  ${fail ? '아직 신청하지 마세요.' : '신청해도 됩니다 (애드센스 → 사이트 → 검토 요청은 직접).'}`);
process.exit(fail ? 1 : 0);
