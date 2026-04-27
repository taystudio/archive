'use client';

import { useEffect, useRef, useState } from 'react';
import { getFile, putFile } from '@/lib/github';
import { THEMES, DEFAULT_THEME_ID } from '@/lib/themes';

const CONFIG_PATH = 'blog/config/theme.json';

type Props = {
  onSavedMessage?: (msg: string) => void;
};

export default function ThemeEditor({ onSavedMessage }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(DEFAULT_THEME_ID);
  const shaRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFile(CONFIG_PATH);
        if (f) {
          shaRef.current = f.sha;
          try {
            const parsed = JSON.parse(f.content);
            if (parsed?.preset) setSelected(parsed.preset);
          } catch {
            setErr('theme.json 파싱 실패.');
          }
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const content = JSON.stringify({ preset: selected }, null, 2) + '\n';
      await putFile(
        CONFIG_PATH,
        content,
        `chore(blog): switch theme to ${selected}`,
        shaRef.current ?? undefined,
      );
      const refreshed = await getFile(CONFIG_PATH);
      if (refreshed) shaRef.current = refreshed.sha;
      onSavedMessage?.(`테마 "${selected}" 저장. 페이지 새로고침 시 반영.`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-center text-[var(--muted)] text-sm">테마 로딩 중…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          테마 ({THEMES.length}개 프리셋)
        </h2>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {saving ? '저장 중…' : '테마만 저장'}
        </button>
      </div>

      {err && <p className="text-red-500 text-xs mb-3">{err}</p>}

      <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
        프리셋을 선택하고 "테마만 저장" 을 누르세요. 저장 후 페이지를 새로고침하면 반영됩니다.
      </p>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {THEMES.map((t) => {
          const active = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={
                'text-left rounded-xl border overflow-hidden transition-all ' +
                (active
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40'
                  : 'border-[var(--border)] hover:border-[var(--accent)]')
              }
            >
              <div
                className="h-20 relative"
                style={{ background: t.preview.bg, color: t.preview.fg }}
              >
                <div
                  className="absolute inset-3 rounded-md p-2 text-[10px] leading-tight"
                  style={{ background: t.preview.surface, color: t.preview.fg }}
                >
                  Aa · 본문 샘플
                  <div
                    className="mt-1 inline-block rounded-full px-1.5"
                    style={{ background: t.preview.accent, color: '#fff' }}
                  >
                    accent
                  </div>
                </div>
              </div>
              <div className="p-2.5 bg-[var(--surface)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[var(--fg)] truncate">{t.name}</div>
                  {active && (
                    <span className="text-[10px] text-[var(--accent)] font-semibold">선택됨</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-2">
                  {t.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
