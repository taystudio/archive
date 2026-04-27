# 사이드바 위젯 시스템

사이드바/홈 상단/포스트 하단을 "플러그인처럼" 위젯으로 구성하는 구조입니다.

## 빠른 요약

- **설정 파일**: `config/widgets.json` (slot별 위젯 배열)
- **위젯 소스**: `components/widgets/*.tsx` (한 파일 = 한 위젯)
- **레지스트리**: `components/widgets/registry.ts` — type → Component 매핑
- **스키마**: `lib/widget-schemas.ts` — type → label/description/props 필드 정의 (Settings UI 자동 생성)
- **타입/로더**: `lib/widgets.ts` (types only, 클라이언트 안전) + `lib/widgets-server.ts` (fs 접근, 서버 전용)
- **슬롯 렌더러**: `components/WidgetSlot.tsx` (`name="sidebar" | "home_hero" | "post_bottom"`)

## 슬롯 (widget slots)

| slot | 위치 | 레이아웃 기본값 |
|---|---|---|
| `sidebar` | 우측 사이드바 (lg+) | column |
| `home_hero` | 홈 히어로 바로 아래 | row (반응형) |
| `post_bottom` | 포스트 말미 (광고 end 다음, 관련글 앞) | row |

새 슬롯 추가하려면:
1. `lib/widgets.ts` 의 `WidgetSlotName` 타입과 `SLOT_NAMES`/`SLOT_LABELS`에 추가
2. 렌더할 페이지에 `<WidgetSlot name="..." />` 배치
3. `DEFAULT_WIDGETS.slots` 에도 빈 배열 추가

## config/widgets.json 구조

```json
{
  "slots": {
    "sidebar": [
      { "type": "categories", "enabled": true },
      { "type": "recent-posts", "enabled": true, "props": { "count": 5 } },
      { "type": "visitor-counter", "enabled": true, "props": { "provider": "hits", "target": "https://..." } }
    ],
    "home_hero": [],
    "post_bottom": []
  }
}
```

**하위호환**: 기존 `{ "widgets": [...] }` 형식은 자동으로 `slots.sidebar`로 매핑됨 (`normalizeWidgetsFile`).

## Settings UI로 관리

`/admin/settings/` → 페이지 하단 "위젯" 섹션:
- 슬롯 탭 전환 (사이드바 / 홈 상단 / 포스트 하단)
- 위젯 드래그(`≡` 핸들)로 순서 변경, 또는 ▲▼ 버튼
- 활성/비활성 체크박스 (json `enabled`)
- 편집 버튼으로 props 폼 열기 (schema 기반 자동 생성)
- 삭제 버튼
- 상단 "+ {위젯명}" 버튼으로 추가
- "위젯만 저장" 버튼 (site.json 과 독립, widgets.json 만 저장)

## 기본 제공 위젯

| type | 용도 | 주요 props |
|---|---|---|
| `categories` | 카테고리 트리 | — |
| `recent-posts` | 최근 글 목록 | `count` (기본 5) |
| `tag-cloud` | 태그 클라우드 | `max` (기본 30) |
| `stats` | 글/태그 개수 | — |
| `visitor-counter` | 방문자 카운터 | `provider`, `target`, `siteCode`, `customTotalUrl`, `customTodayUrl` |

### visitor-counter: 3가지 provider

**1. `hits`** (기본, 가입 불필요)
- `hits.seeyoufarm.com` SVG 배지 (total/today 두 줄)
- `target` URL만 채우면 작동. 페이지 방문 시 자동 증가
- 단점: hits.seeyoufarm.com 서버 다운 시 배지 안 뜸

**2. `goatcounter`** (가입 무료)
- `siteCode` 입력 → `{siteCode}.goatcounter.com` API에서 카운트 가져옴
- **중요**: 카운팅은 별도 pixel script 필요. `app/layout.tsx`에 아래 추가:
  ```tsx
  <Script
    data-goatcounter="https://YOUR_CODE.goatcounter.com/count"
    async
    src="//gc.zgo.at/count.js"
  />
  ```
- 위젯은 숫자만 표시. pixel 없이 enabled 하면 카운트는 0

**3. `custom`**
- 자체 API 엔드포인트 호출. JSON `{count: n}` 또는 단일 number 반환 필요
- `customTotalUrl` / `customTodayUrl` 각각 입력

## 새 위젯 추가하는 법

예: "About me" 위젯.

### 1. 컴포넌트 작성
`components/widgets/AboutMeWidget.tsx`:
```tsx
import WidgetSection from './WidgetSection';

export default function AboutMeWidget({ text }: { text?: string }) {
  return (
    <WidgetSection title="About">
      <p className="text-sm text-[var(--muted)]">{text ?? 'Software engineer'}</p>
    </WidgetSection>
  );
}
```

### 2. 타입 union에 추가
`lib/widgets.ts`:
```ts
export type WidgetType =
  | 'categories'
  | 'recent-posts'
  | 'tag-cloud'
  | 'stats'
  | 'visitor-counter'
  | 'about-me';  // ← 추가
```

### 3. 스키마 등록 (Settings UI 표시용)
`lib/widget-schemas.ts`의 `WIDGET_META`:
```ts
'about-me': {
  type: 'about-me',
  label: 'About Me',
  description: '자기소개 카드',
  defaultProps: { text: 'Software engineer' },
  fields: {
    text: { label: '본문', kind: 'text', default: 'Software engineer' },
  },
},
```

### 4. 레지스트리에 등록
`components/widgets/registry.ts`:
```ts
import AboutMeWidget from './AboutMeWidget';

export const WIDGET_REGISTRY: Record<WidgetType, ComponentType<AnyProps>> = {
  // ...
  'about-me': AboutMeWidget as ComponentType<AnyProps>,
};
```

끝. Settings UI에 자동으로 "+ About Me" 추가 버튼과 편집 폼이 나옴.

## 디자인 원칙

- **모든 위젯은 `<WidgetSection title="...">` 으로 감싼다** — 일관된 카드 톤 (rounded-xl + surface + border).
- **Server component 우선** — 빌드타임에 데이터 읽을 수 있으면 server. `VisitorCounter`처럼 런타임 fetch만 `'use client'`.
- **클라이언트 컴포넌트에서 `lib/widgets-server.ts` import 금지** — fs 쓰므로 번들 실패. 타입은 `lib/widgets.ts`에서.
- **props는 JSON-serializable만**. 함수/Date/JSX 등은 config json에서 표현 불가.
- **레지스트리/스키마/config 3곳을 동기화** — 새 위젯은 3곳 다 터치해야 함. 자동화하려면 filename-based discovery로 확장 가능.

## 파일 지도

- `config/widgets.json` — 슬롯별 활성 위젯
- `lib/widgets.ts` — 타입/상수/normalize (client-safe)
- `lib/widgets-server.ts` — fs 로더 (server only)
- `lib/widget-schemas.ts` — Settings UI용 meta
- `components/WidgetSlot.tsx` — 슬롯 이름 받아 위젯 렌더
- `components/Sidebar.tsx` — 얇은 wrapper (`<WidgetSlot name="sidebar" />`)
- `components/widgets/WidgetSection.tsx` — 공통 카드 셸
- `components/widgets/registry.ts` — type → Component
- `components/widgets/*Widget.tsx` — 위젯 본체
- `components/editor/WidgetsEditor.tsx` — Settings UI (드래그/순서/활성/props)
