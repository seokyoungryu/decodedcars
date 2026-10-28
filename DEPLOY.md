# 배포 가이드 (CarRadar → 실제 이름은 결정 후 변경)

계정·결제·비밀번호가 필요한 단계는 직접 하셔야 하고, 나머지는 Claude가 합니다. ☐ 표시가 직접 하실 일입니다.

## 0. 이름 정하기
- ☐ 사이트 이름 고르기: 후보 CarPickHub(carpickhub.com), ModelYearHub, BestCarYears, CarFactsHub (2026-10-28 기준 .com 구매 가능)
- Claude: 사이트 안의 이름(`src/config/site.ts`, 번역 문구, 봇 이름)을 한 번에 바꿈

## 1. 도메인 (Cloudflare Registrar, 연 약 $10)
- ☐ Cloudflare 대시보드 → Domain Registration → 도메인 구매

## 2. GitHub 저장소
- ☐ github.com에서 **공개(public)** 저장소 생성 (예: `carpickhub`). README·.gitignore 추가하지 말고 빈 저장소로
  - 공개인 이유: 매일 수집·빌드가 30~90분 걸려서 비공개 무료 한도(월 2,000분)를 넘음. 공개 저장소는 Actions가 무제한 무료
  - 공개돼도 문제없음: 비밀키는 Secrets에만 들어가고, 저장소에는 코드와 공개 데이터 시드만 있음
- 저장소 주소를 알려주시면 Claude가 연결하고 push (처음 한 번 GitHub 로그인 창이 뜰 수 있음)

## 3. Cloudflare Pages 프로젝트와 API 토큰
- ☐ Workers & Pages → Create → Pages → **Upload assets** → 프로젝트 이름 `carradar` (이름 바꾸면 Claude가 workflow도 수정) → 아무 파일이나 한 번 업로드해서 생성
- ☐ My Profile → API Tokens → Create Token → Custom token:
  - Account › Cloudflare Pages › **Edit**
  - Account › Account Analytics › **Read**
- ☐ 대시보드 오른쪽의 **Account ID** 복사

## 4. GitHub Secrets (저장소 → Settings → Secrets and variables → Actions)
- ☐ `CLOUDFLARE_API_TOKEN` = 3에서 만든 토큰
- ☐ `CLOUDFLARE_ACCOUNT_ID` = Account ID
- ☐ `SITE_CONTACT` = 연락 가능한 URL이나 이메일 (위키미디어가 요구하는 봇 연락처, 예: `https://도메인/contact`)
- 토큰·ID는 채팅에 붙여 넣지 말고 GitHub 화면에만 입력하세요.

## 5. 첫 실행
- ☐ 저장소 → Actions → **Daily update** → Run workflow
- 첫 실행은 `seed/cache`(안전등급·치수·사진 선택·트림 데이터)에서 시작하므로 첫날부터 완성된 사이트가 올라감
- 이후 매일 10:30 UTC(한국 19:30)에 자동 실행

## 6. 도메인 연결과 마무리 (Claude가 코드 수정, 대시보드는 직접)
- ☐ Pages 프로젝트 → Custom domains → 도메인 추가 (+ www → 루트 리디렉션 규칙)
- Claude: `src/config/site-url.mjs`, `public/robots.txt`를 새 도메인으로 변경
- ☐ Cloudflare → Email → Email Routing: `hello@도메인` → 내 Gmail로 전달 설정
- Claude: `CONTACT_EMAIL = 'hello@도메인'` 설정 (애드센스 점검 항목)
- ☐ Google Search Console: 도메인 속성 추가(DNS TXT) → `sitemap-index.xml` 제출

## 7. 애드센스 (서두르지 않기: FreeConvertter 거절 교훈)
- 공개일로부터 **28일 이상** 지나고, Search Console에서 페이지가 색인된 뒤 신청
- 신청 전: `SITE_LAUNCH=공개일 npm run check:adsense` → ✗가 0개일 때만
- 이미 반영된 것: 빈약한 페이지 0개(300단어 미만은 내용 보강 또는 noindex), 반복 문단 정리(설명은 /methodology 한 곳), 소개·문의·약관·개인정보(영/스) 페이지, ads.txt, 사이트 확인 태그
- ☐ 애드센스 → 사이트 → 추가 → 검토 요청은 직접. 승인 전에는 광고 단위(`ADSENSE_SLOTS`)를 비워 둠
