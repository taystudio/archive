# Blog dev 상태 노트 (2026-04-17)

다음 세션에서 Claude가 바로 이어받을 수 있도록 현재 구조/결정사항/남은 일을 정리.

## 배경 / 목표

- `Archive/blog/`는 AdSense 수익 + Tistory 구조 이식이 목표.
- 정적 export(`output: 'export'`)로 `taehyuklee.github.io/Archive/blog` 배포.
- Admin UI(`/admin`)에서 포스트/카테고리/사이트 설정을 브라우저에서 수정 → GitHub API로 커밋.

## 이번 세션에서 한 일

### 문제
- Admin UI는 원래 "GitHub PAT 있어야만" 동작. `NEXT_PUBLIC_DEV_GH_TOKEN`이 비어 있으면 Settings/Category 에디터가 `categories.json`/`site.json`조차 못 읽어서 하드코딩 기본값을 보여주고 있었음.
- 사용자는 토큰 없이 전체 기능을 먼저 테스트하고 싶어함.

### 해결
1. **`blog/app/api/local/route.ts` 신규 (dev-only)**
   - Next.js App Router API 라우트. `GET`/`PUT`/`DELETE` + `?op=list`.
   - 레포 루트 기준 상대 경로로 실제 파일 시스템에 읽기/쓰기.
   - `resolveSafe()`로 레포 루트 탈출 방지, `forbidProd()`로 prod 차단.
2. **`blog/lib/github.ts` 로컬 fs 분기**
   - `DEV_SENTINEL = '__DEV__'` — PATLogin에서 비번 입력 시 `saveToken(DEV_SENTINEL)`.
   - `isDevMode()`: localStorage 토큰이 sentinel인지.
   - `useLocalFs()`: dev 모드인데 `NEXT_PUBLIC_DEV_GH_TOKEN`도 없으면 true.
   - `getFile`/`listDir`/`putFile`/`deleteFile`/`uploadImage` 모두 `useLocalFs()` 분기 추가. GitHub API 대신 `/api/local`로.
   - `verifyToken()`: dev sentinel + 토큰 없을 때도 `{ login: 'dev (local fs)' }` 반환해서 로그인 성공.
3. **`blog/next.config.mjs` 조건화**
   - `output: 'export'`를 `isProd`일 때만 적용. dev 서버에서 API 라우트가 동작하도록.
   - ⚠ 프로덕션 빌드(`npm run build`)에서는 output:'export' 때문에 API 라우트와 충돌할 수 있음. 지금은 prod에서만 export가 켜지므로 **로컬 `next build` 자체가 실패할 가능성** 있음. 배포 전 확인 필요 (아래 "남은 일" 참고).
4. **`blog/components/editor/PATLogin.tsx` 안내 문구** — 로컬 fs 모드 반영.

## 테스트 방법

```bash
cd blog
npm run dev
# → http://localhost:3000/admin
# → 비밀번호 "1" 입력 → 로그인
# → Settings/Category 페이지에서 실제 config/site.json, config/categories.json 내용이 보여야 정상
# → 수정 후 저장 → 로컬 파일이 바로 수정됨 (git status로 확인)
```

포스트 작성/이미지 업로드도 동일하게 로컬 fs에 기록됨. 커밋은 사용자가 수동으로.

## 작동 원리 (요약)

| 상황 | 토큰 상태 | 동작 |
|---|---|---|
| 비번 "1" + env 토큰 없음 | `__DEV__` sentinel만 | `/api/local`로 로컬 fs 읽기/쓰기 |
| 비번 "1" + env 토큰 있음 | sentinel이 실토큰으로 해석됨 | GitHub API 실커밋 |
| PAT 직접 입력 | 실토큰 저장 | GitHub API 실커밋 |

분기 포인트: `useLocalFs()` (github.ts:33).

## 남은 일 / 주의사항

1. **프로덕션 빌드 검증 안 됨**. `NODE_ENV=production npm run build` 돌려서 `output: 'export'` + `app/api/` 공존이 에러 나는지 확인 필요. 에러 나면 두 가지 옵션:
   - (a) 빌드 스크립트에서 `app/api/`를 일시적으로 제외/이동
   - (b) API 라우트 내부에서 `export const dynamic = 'force-static'` 같은 플래그로 우회
   - 가장 안전: `package.json`의 `build` 스크립트를 `rm -rf app/api && next build` 같은 식으로 바꾸기 (단, 소스엔 남겨둠).
2. **dev 서버에서 basePath 없음** — 프로덕션은 `/Archive/blog` 서브경로. 현재 `LOCAL_API = '/api/local'` 하드코딩인데 dev에선 basePath 비어있어 OK. prod에서는 API 라우트가 아예 없어야 정상.
3. **보안**: `/api/local`은 `NODE_ENV=production`에서 403 반환. 그래도 레포 루트 내부는 read/write 가능하므로, 누군가 실수로 prod에서 `NODE_ENV`를 벗겨서 서버를 띄우지 않도록 주의.
4. **동시성**: 로컬 fs에 단순 write — 여러 탭에서 동시에 저장하면 race. 혼자 쓰는 도구이므로 무시.
5. **이미지 업로드**: `blog/public/images/<slug>/<filename>`에 저장. dev에서 `<img src={basePath}/images/...>`의 basePath가 빈 문자열이라 `/images/...`로 접근 → Next.js가 `public/` 서빙해주므로 OK.

## 파일 지도

- `blog/app/api/local/route.ts` — dev 로컬 fs API (신규)
- `blog/lib/github.ts` — dev 모드 분기 포함 (수정)
- `blog/components/editor/PATLogin.tsx` — 안내 문구 (수정)
- `blog/next.config.mjs` — output 조건화 (수정)
- `blog/components/editor/SettingsEditor.tsx`, `CategoryEditor.tsx` — 변경 없음. `getFile`/`putFile` 시그니처가 그대로라 자동으로 로컬 모드 사용.
- `blog/config/site.json`, `blog/config/categories.json` — 로컬 저장 대상
- `blog/posts/` — 포스트 MDX 저장 위치
