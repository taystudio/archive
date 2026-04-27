'use client';

import { useEffect, useRef, useState } from 'react';
import { getFile, putFile } from '@/lib/github';

const CONFIG_PATH = 'blog/config/custom.css';

const SNIPPETS: Array<{ label: string; css: string }> = [
  {
    label: '본문 글꼴 변경',
    css: `.prose {\n  font-family: "Iowan Old Style", "Palatino", serif;\n  font-size: 18px;\n}\n`,
  },
  {
    label: '인용문 강조',
    css: `.prose blockquote {\n  border-left-width: 5px;\n  border-left-color: var(--accent);\n  font-style: italic;\n}\n`,
  },
  {
    label: '코드블록 다크 테마',
    css: `.prose pre {\n  background: #0f172a !important;\n  color: #e2e8f0 !important;\n  border-radius: 12px;\n  padding: 1.2em;\n}\n`,
  },
  {
    label: '제목 밑줄',
    css: `.prose h2 {\n  border-bottom: 2px solid var(--accent-soft);\n  padding-bottom: 0.3em;\n}\n`,
  },
  {
    label: '카드 강한 그림자',
    css: `.card-hover {\n  box-shadow: 0 8px 24px rgba(0,0,0,0.08);\n  border-radius: 16px;\n}\n.card-hover:hover {\n  box-shadow: 0 16px 36px rgba(0,0,0,0.14);\n}\n`,
  },
];

type Props = {
  onSavedMessage?: (msg: string) => void;
};

export default function CustomCssEditor({ onSavedMessage }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [css, setCss] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const shaRef = useRef<string | null>(null);
  const previewStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFile(CONFIG_PATH);
        if (f) {
          shaRef.current = f.sha;
          setCss(f.content);
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live preview: inject the textarea content as a temporary <style> tag,
  // overriding the saved custom.css until the toggle is turned off.
  useEffect(() => {
    const existing = previewStyleRef.current;
    if (existing) {
      existing.remove();
      previewStyleRef.current = null;
    }
    if (!previewing) return;
    const el = document.createElement('style');
    el.setAttribute('data-custom-css-preview', 'true');
    el.textContent = css;
    document.head.appendChild(el);
    previewStyleRef.current = el;
    return () => {
      el.remove();
      if (previewStyleRef.current === el) previewStyleRef.current = null;
    };
  }, [previewing, css]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await putFile(
        CONFIG_PATH,
        css,
        'chore(blog): update custom.css',
        shaRef.current ?? undefined,
      );
      const refreshed = await getFile(CONFIG_PATH);
      if (refreshed) shaRef.current = refreshed.sha;
      onSavedMessage?.('커스텀 CSS 저장됨. 페이지 새로고침 시 반영.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    setCss((cur) => (cur.endsWith('\n') ? cur : cur + '\n') + '\n' + snippet);
  };

  if (loading) {
    return <div className="py-6 text-center text-[var(--muted)] text-sm">CSS 로딩 중…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          커스텀 CSS (스킨)
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={previewing}
              onChange={(e) => setPreviewing(e.target.checked)}
            />
            라이브 프리뷰
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {saving ? '저장 중…' : 'CSS 저장'}
          </button>
        </div>
      </div>

      {err && <p className="text-red-500 text-xs mb-3">{err}</p>}

      <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
        Tistory 스킨처럼 자유롭게 CSS 작성. <code>.prose</code>, <code>.toastui-editor-contents</code>,{' '}
        <code>--accent</code> 같은 변수/클래스를 오버라이드하면 됩니다. 라이브 프리뷰는 이 탭에서만
        반영되고, 저장 후 새로고침해야 다른 페이지에 적용.
      </p>

      <div className="mb-3">
        <div className="text-[11px] text-[var(--muted)] mb-1.5">자주 쓰는 스니펫:</div>
        <div className="flex flex-wrap gap-1.5">
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => insertSnippet(s.css)}
              className="text-[11px] rounded-md border border-[var(--border)] px-2 py-1 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              + {s.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        spellCheck={false}
        value={css}
        onChange={(e) => setCss(e.target.value)}
        className="w-full font-mono text-[12px] leading-relaxed p-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] outline-none focus:border-[var(--accent)]"
        style={{ minHeight: '320px', resize: 'vertical' }}
        placeholder="/* CSS 여기에 작성 */"
      />
      <p className="mt-2 text-[11px] text-[var(--muted)]">
        파일 위치: <code>{CONFIG_PATH}</code> · 빈 값으로 두면 적용 없음
      </p>
    </div>
  );
}
