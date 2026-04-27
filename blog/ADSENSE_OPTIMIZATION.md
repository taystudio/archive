# AdSense 최적화 개편 기록 (2026-04-17)

이 문서는 Archive/blog 의 톤/레이아웃/광고 슬롯을 **AdSense 수익 최적화 관점**에서 전반 개편한 내역을 정리합니다. 다음에 디자인/광고를 건드릴 때 "왜 이렇게 되어 있는지" 맥락을 복원할 수 있게, 결정마다 **Why** 를 남깁니다.

## 핵심 원칙 3가지

AdSense RPM(페이지뷰당 수익)의 대부분은 아래 3축이 결정합니다. 이번 개편은 이 축을 직접 타깃했습니다.

1. **CTR (클릭률)** — 광고가 콘텐츠 흐름에 자연스럽게 녹아있을수록 ↑
2. **체류시간 / 페이지뷰 수** — 본문 가독성 + 관련 글 노출 + 내부 링크 밀도
3. **Core Web Vitals (LCP/CLS/INP)** — Google의 ad auction 입찰가에 직접 반영. 특히 CLS 가 치명적

---

## 파일별 변경 요약

| 파일 | 변경 | 목적 |
|---|---|---|
| `app/globals.css` | 팔레트/타이포/AdSlot 예약공간 스타일 추가 | 톤 부드럽게 + CLS 제로화 |
| `components/AdSense.tsx` | IntersectionObserver 지연 로드, variant/size 추가, 플레이스홀더 렌더 | CLS 방지 + AdSense JS 늦게 로드 |
| `components/AdSlot.tsx` (신규) | 슬롯 이름 → (slot id, variant) 매핑 | 슬롯 위치만 지정하면 되도록 추상화 |
| `components/MobileStickyAd.tsx` (신규) | 하단 sticky 배너 + 6시간 닫기 기억 | 모바일 CTR 주요 슬롯 |
| `components/ReadingProgress.tsx` (신규) | 상단 2px 프로그레스 바 | 체류시간 ↑ (시각 보상) |
| `components/RelatedPosts.tsx` (신규) | 관련 글 3개 카드 | 세션당 페이지뷰 ↑ |
| `components/PostGrid.tsx` | 6번째 포스트마다 in-feed 광고 삽입 | 자연스러운 in-feed 광고 |
| `components/PostCard.tsx` | 둥근 카드 + hover lift | 톤 부드럽게 + 클릭 유도 |
| `components/Sidebar.tsx` | `variant="left"/"right"` 분리 | 3열 레이아웃 양쪽으로 분산 |
| `components/Footer.tsx` | Privacy/About 링크 + 모바일 sticky ad 공간 확보 | AdSense 정책 + 레이아웃 안 겹치게 |
| `app/(site)/layout.tsx` | 220px / 720px / 320px 3열 그리드 | 우측 ad rail + 가독 본문 폭 |
| `app/(site)/blog/[slug]/page.tsx` | 광고 3슬롯(top/mid/end) + RelatedPosts + ReadingProgress | 포스트 페이지 전면 개편 |
| `app/(site)/page.tsx` | 히어로 타이포 정리 | 첫인상 부드럽게 |
| `lib/split-content.ts` (신규) | 본문을 중간 H2 또는 문단 경계로 분할 | 본문 중간 광고를 코드/표 한가운데에 끼우지 않기 위함 |

---

## 1. 광고 슬롯 전략

### 1-1. 슬롯 지도 (`AdSlot.tsx`)

| 이름 | 위치 | variant | 왜 |
|---|---|---|---|
| `post-top` | 포스트 본문 진입 직후 | inline 280px | 상단 체류시간 가장 길어 **viewability** 최고. 단, 본문 위가 아닌 **아래**에 배치해서 정책 위반(콘텐츠 위 광고 1개만) 회피 |
| `post-mid` | 본문 중간 (H2 또는 문단 경계 기준 분할) | inline 280px | in-article 광고는 평균 CTR 3–5배. **코드블록/테이블 한가운데 삽입되지 않게** `split-content.ts` 가 경계 탐색 |
| `post-end` | 본문 종료 후, Related 앞 | inline 280px | 완독자는 구매의향 높음 → end-of-content RPM 우수 |
| `rail` | 데스크톱 우측 sticky (320×600) | rail 600px | 스크롤 내내 viewable. 데스크톱 수익의 핵심 |
| `infeed` | 목록 페이지 6번째 카드마다 | infeed 140px | in-feed 광고는 "추천 콘텐츠"처럼 보여 CTR 높음 |
| `mobile-sticky` | 모바일 하단 고정 (lg 이하) | 60px | 모바일 수익의 대부분. 닫기 버튼 6시간 기억 |

**Why 4개가 아니라 6개 슬롯?**
AdSense 정책은 광고:콘텐츠 비율이 대체로 1:1을 초과하지 않으면 OK. 포스트 길이 800자 미만이면 `post-top/mid/end` 는 렌더되지 않도록 `isLongEnough` 조건을 걸었습니다 (`blog/[slug]/page.tsx:72`). 짧은 글에서 광고 과밀 방지.

### 1-2. 코드는 어떻게 지연 로드?

`AdSense.tsx` 에 IntersectionObserver 를 달아서 **슬롯이 뷰포트에서 200px 이내로 접근할 때까지 `<ins>` 엘리먼트 자체를 mount 하지 않습니다**. 이유:
- AdSense 스크립트가 모든 `<ins>` 에 대해 즉시 auction 을 시작하면 LCP/INP 악화
- 뷰포트 밖 슬롯은 어차피 impression 안 나므로 로드해도 낭비
- 또한 본문 읽는 동안 네트워크 경합을 줄여 실제 본문 로딩 체감 속도를 개선

### 1-3. CLS 방지

`globals.css` 의 `.ad-slot--inline { min-height: 280px }` 처럼 **variant별 최소 높이를 CSS로 예약**. 광고가 로드되기 전/후로 본문이 점프하지 않습니다. Google 의 Core Web Vitals 측정 기준에서 CLS > 0.1 이면 "poor" 로 분류되어 AdSense 경매가가 떨어집니다.

또한 슬롯에는 `Sponsored` 라벨을 `::before` 로 넣어서 **광고임을 명시** — AdSense 정책 요구사항이자 사용자 신뢰 ↑.

### 1-4. 본문 중간 분할 (`lib/split-content.ts`)

단순하게 "글자수 50% 지점" 에 광고를 끼우면:
- 코드블록 중간에 삽입돼서 코드 읽기 방해
- 문장 중간에 끼워지면 시각적으로 흉함
- 표(`<table>`) 중간이면 깨짐

알고리즘:
1. 최소 1200자가 넘는 지점부터 **첫 번째 `## H2`** 를 찾으면 그 앞에 삽입
2. 없으면 **빈 줄(문단 경계)** 사용
3. code fence (```` ``` ````) 안에서는 절대 분할 안 함 (`inFence` 플래그)
4. 글자수가 `1200 * 1.6 = 1920` 미만이면 아예 분할 안 함 (짧은 글은 mid 광고 없음)

**Why 1200자?** 한국어 기준 약 2–3분 읽기 시간. 이 시점이 독자가 페이지를 이탈하려는 첫 번째 포인트 — 광고 노출 확률 + 실제 클릭까지 자연스러운 타이밍.

---

## 2. 레이아웃 재구성

### 2-1. 3열 그리드 (`app/(site)/layout.tsx`)

```
┌─────────┬─────────────────┬──────────┐
│ 220px   │ 720px           │ 320px    │
│ 카테고리 │ 본문 (max-w)     │ Ad rail  │
│ Recent  │                 │ + 태그    │
│         │                 │ + Stats  │
└─────────┴─────────────────┴──────────┘
  ↑ lg+만   ↑ 항상           ↑ lg+만
```

**Why 720px 본문?**
- 한글 본문 60–75ch (약 17px × 약 45–50글자/행) → 가독성 최적
- 좁아야 눈 피로 ↓ → 체류시간 ↑
- 좁아야 좌우에 광고 공간 자연스럽게 확보

**Why 좌측도 사이드바?**
기존에는 우측 240px 사이드바 1개만 있었는데, 그 자리에 320px 광고 rail 을 두어야 해서 사이드바를 좌측으로 옮기고 **Sidebar 를 `variant` 로 쪼갰습니다** (`left` = Categories+Recent, `right` = Tags+Stats). 정보 과밀 해소 + 좌우 균형.

### 2-2. 모바일 대응
- lg 이하에서는 양쪽 사이드바 `hidden`
- 광고는 in-content (post-top/mid/end) + in-feed + mobile-sticky 4종
- mobile-sticky 에 닫기 버튼 (6시간 TTL). UX 과도한 훼방 방지 + AdSense 정책(닫기 가능해야 함)

### 2-3. Header sticky + blur
기존에도 있었지만 `backdrop-blur bg-[var(--bg)]/85` 로 톤 살짝 부드럽게. z-20 으로 올려서 mobile-sticky ad(z-40) 보다 아래, reading progress(z-50) 보다 아래.

---

## 3. 톤 / 타이포그래피

### 3-1. 팔레트 (`globals.css`)

| 토큰 | Before | After | Why |
|---|---|---|---|
| `--bg` | `#ffffff` | `#fafaf8` | 순백은 광고와 본문 경계가 너무 날카로움. off-white 는 눈부심 ↓ |
| `--surface` | (없음) | `#ffffff` | 카드/광고 슬롯이 배경 위에 올라와 있음을 표현 |
| `--accent` | `#2563eb` (blue) | `#3f6f54` (forest green) | 블루는 AdSense 링크 기본색과 동색 → 구분 희미. 그린은 **AdSense 광고 링크(보통 파랑)와 확연 구분** 되어 "이건 사이트 UI, 저건 광고" 인지 쉬움 |
| `--accent-soft` | (없음) | accent 12% | hover/selection 배경 |
| `--border` | `#e5e7eb` | `#ececea` | 한 톤 더 warm |
| `--shadow-sm/md` | (없음) | 1/4px 소프트 | 카드 떠 보이게 |

**Why accent 를 그린으로?** 실제 AdSense 광고 크리에이티브의 80% 는 파란 하이퍼링크입니다. 사이트 UI 도 파랑이면 독자가 "어디가 컨텐츠고 어디가 광고인지" 무의식 중 혼동 → "광고인 줄 알고 안 누르는 UI 링크" 가 늘어 결과적으로 **내부 링크 클릭률이 떨어지고 세션당 PV 가 감소**. 게다가 AdSense 정책은 광고와 유사하게 보이는 UI 를 금지함 (eye-pattern-matching).

### 3-2. 타이포그래피

- 본문 prose 17px / leading-1.8 — 한글 읽기 피로도 개선
- h2 margin-top 2.4em — 섹션 호흡
- 코드/prose 링크 underline-offset 3px — 한글 받침과 겹치지 않게
- `font-feature-settings: 'ss01', 'cv01'` — 일부 폰트에서 대체 글리프 활성 (Pretendard 등)

### 3-3. 마이크로 인터랙션
- 모든 a/button: 150ms ease-out transition
- 카드: `card-hover` 클래스 → hover 시 translateY(-1px) + shadow. "부드러움"의 체감 대부분이 여기서 옴.

---

## 4. 체류시간 / PV 증가 장치

### 4-1. ReadingProgress
상단 2px 바. requestAnimationFrame 으로 scroll throttle. "얼마나 남았지?" 에 대한 시각 보상을 주어 **중도 이탈률 ↓**. 실측 기준 reading progress UI 는 평균 체류시간 +8~15% 개선 효과 (Medium/Substack 데이터).

### 4-2. RelatedPosts
카테고리 일치 + 공통 태그로 가중치 스코어. 상위 3개 카드를 포스트 끝에 노출.
- 카테고리 첫 depth 일치: +4
- 둘째 depth: +3
- 공통 태그 1개당: +2
- 동점이면 최신순

**Why 3개?** 4개 이상이면 결정 피로 ↑ (선택지 역설). 3개가 CTR 최적이라는 게 관련글 위젯의 업계 통설.

### 4-3. Footer 내부 링크
Privacy / About / GitHub 링크 추가. 사이트 신뢰도 ↑ + AdSense 정책 요구사항 (Privacy Policy 페이지는 Google 에서 "강력 권장").

---

## 5. 정책 / 컴플라이언스 체크리스트

AdSense 승인 및 유지에 필요한 요건들:

- [x] **광고 개수 제한**: 짧은 글(<800자)은 inline 광고 차단
- [x] **Sponsored 라벨**: 모든 슬롯에 `::before` 로 표시
- [x] **닫기 가능한 sticky**: mobile-sticky 에 닫기 버튼
- [x] **Privacy Policy 링크**: Footer
- [x] **About 페이지 존재**: 기존 `/about` 유지
- [x] **광고가 콘텐츠로 위장하지 않음**: in-feed 슬롯도 surface 색 + Sponsored 라벨로 구분
- [ ] **ads.txt 파일**: 아직 `public/ads.txt` 없음. 배포 후 AdSense 에서 발급받아 추가 필요
- [ ] **CMP (쿠키 동의 배너)**: EU/한국법 대응. 수익화 규모 커지면 필요
- [ ] **광고가 모달/dropdown 과 겹치지 않음**: 현재는 z-index 관리 중 (sticky header z-20, mobile-sticky z-40). 추후 모달 생길 때 주의

---

## 6. 성능 영향

### 기대 효과
- **CLS**: ~0 (모든 광고 슬롯 min-height 예약)
- **LCP**: 개선 예상 (AdSense 스크립트 IO 지연 로드로 초기 네트워크 경합 ↓)
- **INP**: 변화 적음. reading progress 가 scroll 리스너 추가했으나 rAF throttle 됨

### 잠재 리스크
1. **AdSense script 자체는 여전히 `afterInteractive`** 로 layout.tsx 에서 로드. IO 지연은 `<ins>` mount 지연이지 script 로드 지연은 아님. script 용량 자체를 줄이려면 lazyOnload 로 변경 고려 (단, 첫 광고가 매우 늦게 뜸).
2. **본문 MDX 를 2번 렌더** (before/after) — rehype 플러그인이 2회 실행. 포스트가 매우 길 때 빌드 시간 체감 느려질 수 있음 (rsc 라 runtime 영향 없음).
3. **3열 레이아웃은 viewport 1024px 이상에서만 의미** — 태블릿(768~1023px)은 기존 2열보다 덜 정보 밀도 있어 보일 수 있음. 필요 시 md 에서 2열 중간 폼 추가 고려.

---

## 7. 남은 일 / 다음 개선 후보

**반드시 해야 할 것**
1. `NEXT_PUBLIC_ADSENSE_CLIENT` 환경변수 실제 퍼블리셔 ID 로 채우기
2. `AdSlot.tsx` 의 `SLOT_MAP` 에 들어있는 placeholder slot id (`1111111111` 등) 를 AdSense 관리 콘솔에서 발급받은 실제 slot id 로 교체
3. `public/ads.txt` 추가 (AdSense → Sites → ads.txt 파일 받아 저장)
4. Giscus 댓글 연결 (체류시간에 큰 영향)

**선택 개선**
5. 우측 rail 을 "상단 ad → Tags → Stats → 추가 ad" 로 확장 (긴 포스트 페이지에서 두 번째 rail ad)
6. TOC (목차) 우측 상단 sticky — 긴 글에서 네비게이션 개선
7. 이미지 블러플레이스홀더 (next/image blurDataURL) — LCP 개선
8. 태그 페이지에 infeed ad 추가
9. PostCard 에서 WebP thumbnail 자동 변환 (빌드 스크립트)

**수익 실험**
10. 슬롯 위치 A/B (ex. post-top 을 header 바로 밑 vs. 첫 단락 뒤)
11. 색상 A/B (accent 를 미색/세이지/라벤더로) — AdSense 광고 구분성과 사이트 매력 사이 trade-off 실험
12. 관련글 개수 3 vs. 4 vs. 6 비교

---

## 파일 참조 (빠른 점프)

- 팔레트/타이포: `blog/app/globals.css:5-37`
- AdSlot 매핑: `blog/components/AdSlot.tsx:7-14`
- 본문 분할: `blog/lib/split-content.ts:7-41`
- 광고 지연 로드: `blog/components/AdSense.tsx:36-58`
- 3열 그리드: `blog/app/(site)/layout.tsx:8`
- 포스트 페이지 광고 조건: `blog/app/(site)/blog/[slug]/page.tsx:72,115-135`
- 관련글 스코어링: `blog/components/RelatedPosts.tsx:5-15`
- 모바일 sticky 닫기 TTL: `blog/components/MobileStickyAd.tsx:5-6`
