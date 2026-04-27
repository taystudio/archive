'use client';

import { useEffect, useRef, useState } from 'react';
import { getFile, putFile, uploadImage } from '@/lib/github';
import type { SiteConfig, MenuItem, TableStyle } from '@/lib/site';
import { TABLE_STYLES } from '@/lib/site';
import { resolveAssetPath } from '@/lib/asset-path';
import CategoryEditor from './CategoryEditor';
import WidgetsEditor from './WidgetsEditor';
import ThemeEditor from './ThemeEditor';
import CustomCssEditor from './CustomCssEditor';

const CONFIG_PATH = 'blog/config/site.json';

const DEFAULT_CONFIG: SiteConfig = {
  title: 'TayLee Tech & Career Lab',
  description: '',
  menu: [
    { label: 'Home', href: '/' },
    { label: 'Tags', href: '/tags' },
    { label: '방명록', href: '/guestbook' },
    { label: 'About', href: '/about' },
    { label: 'Portfolio', href: '/', external: true, portfolio: true },
  ],
};

const input =
  'rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--accent)]';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function stripBase(src: string): string {
  if (BASE && src.startsWith(BASE)) return src.slice(BASE.length) || '/';
  return src;
}

type TabId = 'general' | 'design' | 'widgets' | 'categories';

const TABS: Array<{ id: TabId; label: string; description: string }> = [
  { id: 'general', label: '사이트', description: '제목, 메뉴, 파비콘, 분석' },
  { id: 'design', label: '디자인', description: '테마, 테이블 스타일, 커스텀 CSS' },
  { id: 'widgets', label: '위젯', description: '사이드바, 홈, 포스트 슬롯' },
  { id: 'categories', label: '카테고리', description: '카테고리 트리 편집' },
];

export default function SettingsEditor({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [uploadingFav, setUploadingFav] = useState(false);
  const [tab, setTab] = useState<TabId>('general');
  const shaRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFile(CONFIG_PATH);
        if (f) {
          shaRef.current = f.sha;
          try {
            const parsed = JSON.parse(f.content);
            setCfg({ ...DEFAULT_CONFIG, ...parsed });
          } catch {
            setErr('site.json 파싱 실패. 기본값으로 표시.');
          }
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateMenu = (idx: number, patch: Partial<MenuItem>) => {
    setCfg((c) => ({ ...c, menu: c.menu.map((m, i) => (i === idx ? { ...m, ...patch } : m)) }));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setCfg((c) => {
      const arr = [...c.menu];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return c;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...c, menu: arr };
    });
  };

  const remove = (idx: number) => {
    setCfg((c) => ({ ...c, menu: c.menu.filter((_, i) => i !== idx) }));
  };

  const add = () => {
    setCfg((c) => ({
      ...c,
      menu: [...c.menu, { label: '새 메뉴', href: '/', external: false }],
    }));
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const content = JSON.stringify(cfg, null, 2) + '\n';
      await putFile(
        CONFIG_PATH,
        content,
        `chore(blog): update site config (menu)`,
        shaRef.current ?? undefined,
      );
      setMsg('저장 완료. 사이트 재빌드 후 반영됩니다.');
      // refresh sha after save
      const refreshed = await getFile(CONFIG_PATH);
      if (refreshed) shaRef.current = refreshed.sha;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-[var(--muted)]">불러오는 중…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {TABS.find((t) => t.id === tab)?.description}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
          >
            ← 목록
          </button>
          {(tab === 'general' || tab === 'design') && (
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-sm disabled:opacity-50"
              title={
                tab === 'design'
                  ? '테이블 스타일 저장 (테마와 CSS는 각자 저장 버튼 사용)'
                  : '사이트 정보 저장'
              }
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          )}
        </div>
      </div>

      {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
      {msg && <p className="text-green-600 dark:text-green-400 text-sm mb-3">{msg}</p>}

      {/* Tab strip */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] mb-6">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                'px-3 py-2 text-sm border-b-2 -mb-px transition ' +
                (active
                  ? 'border-[var(--accent)] text-[var(--accent)] font-medium'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)]')
              }
              title={t.description}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'general' && (
        <>
      {/* Basic — note: Table style section is rendered in the Design tab below */}
      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          기본 정보
        </h2>
        <div>
          <label className="text-xs block mb-1">제목</label>
          <input
            className={`${input} w-full`}
            value={cfg.title}
            onChange={(e) => setCfg({ ...cfg, title: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs block mb-1">설명 (SEO)</label>
          <input
            className={`${input} w-full`}
            value={cfg.description}
            onChange={(e) => setCfg({ ...cfg, description: e.target.value })}
          />
        </div>
      </section>

      {/* Favicon */}
      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          파비콘
        </h2>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center overflow-hidden shrink-0">
            {cfg.favicon ? (
              <img
                src={resolveAssetPath(cfg.favicon) ?? ''}
                alt="favicon"
                className="max-w-[48px] max-h-[48px] object-contain"
              />
            ) : (
              <span className="text-[10px] text-[var(--muted)]">없음</span>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <label className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs cursor-pointer hover:border-[var(--accent)]">
                {uploadingFav ? '업로드 중…' : '파일 업로드'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp,.ico"
                  className="hidden"
                  disabled={uploadingFav}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingFav(true);
                    setErr(null);
                    try {
                      const url = await uploadImage(file, 'favicon');
                      setCfg((c) => ({ ...c, favicon: stripBase(url) }));
                    } catch (ex: unknown) {
                      setErr(ex instanceof Error ? ex.message : String(ex));
                    } finally {
                      setUploadingFav(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              {cfg.favicon && (
                <button
                  onClick={() => setCfg({ ...cfg, favicon: '' })}
                  className="text-xs rounded-md border border-red-500/50 text-red-500 px-2 py-1"
                >
                  삭제
                </button>
              )}
            </div>
            <input
              className={`${input} w-full`}
              placeholder="/images/favicon/... 또는 https://..."
              value={cfg.favicon ?? ''}
              onChange={(e) => setCfg({ ...cfg, favicon: e.target.value })}
            />
            <p className="text-[11px] text-[var(--muted)] leading-snug">
              PNG / SVG / ICO 권장. 정사각 32–180px. 상대경로 저장 시 자동으로 basePath가 덧붙습니다.
              저장 후 브라우저 캐시 때문에 바로 안 바뀔 수 있으니 탭 새로고침(Cmd+Shift+R) 필요.
            </p>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Analytics
        </h2>
        <div>
          <label className="text-xs block mb-1">GoatCounter site code</label>
          <input
            className={`${input} w-full`}
            placeholder="myblog (goatcounter.com에서 받은 subdomain)"
            value={cfg.analytics?.goatcounter ?? ''}
            onChange={(e) =>
              setCfg({ ...cfg, analytics: { ...(cfg.analytics ?? {}), goatcounter: e.target.value.trim() } })
            }
          />
          <p className="text-[11px] text-[var(--muted)] mt-1 leading-snug">
            입력 시 자동으로 pixel script가 모든 페이지에 주입되어 Total/Today/글별 조회수가 기록됩니다.
            가입: <a href="https://www.goatcounter.com/signup" target="_blank" rel="noreferrer">goatcounter.com/signup</a>
            (무료). 가입 후 visitor-counter/post-stats/popular-posts 위젯이 실데이터로 동작.
          </p>
        </div>
      </section>

      {/* Menu */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            헤더 메뉴 ({cfg.menu.length})
          </h2>
          <button
            onClick={add}
            className="text-xs rounded-md border border-[var(--border)] px-2 py-1"
          >
            + 메뉴 추가
          </button>
        </div>

        <ul className="space-y-2">
          {cfg.menu.map((m, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] p-2"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-xs px-1 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === cfg.menu.length - 1}
                  className="text-xs px-1 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <input
                className={`${input} w-32`}
                placeholder="라벨"
                value={m.label}
                onChange={(e) => updateMenu(i, { label: e.target.value })}
              />
              <input
                className={`${input} flex-1`}
                placeholder="경로 (/about)"
                value={m.href}
                onChange={(e) => updateMenu(i, { href: e.target.value })}
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={!!m.external}
                  onChange={(e) => updateMenu(i, { external: e.target.checked })}
                />
                외부
              </label>
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={!!m.portfolio}
                  onChange={(e) =>
                    updateMenu(i, { portfolio: e.target.checked, external: e.target.checked || m.external })
                  }
                />
                포폴
              </label>
              <button
                onClick={() => remove(i)}
                className="text-xs rounded-md border border-red-500/50 text-red-500 px-2 py-1"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-[var(--muted)]">
          · "외부" 체크: 새 탭으로 열림 · "포폴" 체크: 포트폴리오 루트(/Archive/)로 자동 연결
        </p>
      </section>
        </>
      )}

      {tab === 'design' && (
        <>
          <div>
            <ThemeEditor onSavedMessage={setMsg} />
          </div>

          {/* Table style */}
          <section className="mt-10 pt-8 border-t border-[var(--border)] space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              테이블 스타일
            </h2>
            <p className="text-xs text-[var(--muted)] leading-snug">
              사이트 전체 포스트 본문 테이블에 적용됩니다. 변경 후 상단 "저장" 누르세요.
            </p>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
              {TABLE_STYLES.map((s) => {
                const active = (cfg.tableStyle ?? 'classic') === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCfg({ ...cfg, tableStyle: s.id as TableStyle })}
                    className={
                      'text-left rounded-lg border p-2.5 transition ' +
                      (active
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30'
                        : 'border-[var(--border)] hover:border-[var(--accent)]')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{s.name}</div>
                      {active && (
                        <span className="text-[10px] text-[var(--accent)] font-semibold">
                          선택됨
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                      {s.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-10 pt-8 border-t border-[var(--border)]">
            <CustomCssEditor onSavedMessage={setMsg} />
          </div>
        </>
      )}

      {tab === 'widgets' && (
        <div>
          <WidgetsEditor onSavedMessage={setMsg} />
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <CategoryEditor />
        </div>
      )}
    </div>
  );
}
