'use client';

import { useEffect, useRef, useState } from 'react';
import { getFile, putFile } from '@/lib/github';
import type { Category } from '@/lib/categories';

const CONFIG_PATH = 'blog/config/categories.json';

const input =
  'rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--accent)]';

function autoSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export default function CategoryEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const shaRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFile(CONFIG_PATH);
        if (f) {
          shaRef.current = f.sha;
          try {
            setCats(JSON.parse(f.content));
          } catch {
            setErr('categories.json 파싱 실패.');
          }
        } else {
          setErr('categories.json 없음 — 비어있는 상태로 시작');
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
    setMsg(null);
    try {
      const content = JSON.stringify(cats, null, 2) + '\n';
      await putFile(
        CONFIG_PATH,
        content,
        'chore(blog): update categories',
        shaRef.current ?? undefined,
      );
      setMsg('저장 완료. 재빌드 후 반영됩니다.');
      const refreshed = await getFile(CONFIG_PATH);
      if (refreshed) shaRef.current = refreshed.sha;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // --- top-level ops ---
  const updateTop = (i: number, patch: Partial<Category>) => {
    setCats((arr) => arr.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const moveTop = (i: number, dir: -1 | 1) => {
    setCats((arr) => {
      const out = [...arr];
      const j = i + dir;
      if (j < 0 || j >= out.length) return arr;
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });
  };
  const removeTop = (i: number) => {
    if (!confirm(`"${cats[i].name}" 카테고리를 삭제할까요?`)) return;
    setCats((arr) => arr.filter((_, idx) => idx !== i));
  };
  const addTop = () => {
    const name = '새 카테고리';
    setCats((arr) => [...arr, { slug: autoSlug(name) + '-' + (arr.length + 1), name }]);
  };
  const addChild = (i: number) => {
    setCats((arr) =>
      arr.map((c, idx) =>
        idx === i
          ? {
              ...c,
              children: [
                ...(c.children ?? []),
                {
                  slug: 'sub-' + ((c.children?.length ?? 0) + 1),
                  name: '하위 카테고리',
                },
              ],
            }
          : c,
      ),
    );
  };

  // --- child ops ---
  const updateChild = (pi: number, ci: number, patch: Partial<Category>) => {
    setCats((arr) =>
      arr.map((c, idx) =>
        idx === pi
          ? {
              ...c,
              children: (c.children ?? []).map((ch, j) => (j === ci ? { ...ch, ...patch } : ch)),
            }
          : c,
      ),
    );
  };
  const moveChild = (pi: number, ci: number, dir: -1 | 1) => {
    setCats((arr) =>
      arr.map((c, idx) => {
        if (idx !== pi) return c;
        const kids = [...(c.children ?? [])];
        const j = ci + dir;
        if (j < 0 || j >= kids.length) return c;
        [kids[ci], kids[j]] = [kids[j], kids[ci]];
        return { ...c, children: kids };
      }),
    );
  };
  const removeChild = (pi: number, ci: number) => {
    setCats((arr) =>
      arr.map((c, idx) =>
        idx === pi
          ? { ...c, children: (c.children ?? []).filter((_, j) => j !== ci) }
          : c,
      ),
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
        카테고리 로드 중…
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--border)] p-4">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            카테고리 ({cats.length})
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            사이드바에 표시되는 트리. slug는 URL에 쓰임 (영문·숫자·하이픈).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addTop}
            className="text-xs rounded-md border border-[var(--border)] px-2 py-1"
          >
            + 상위 카테고리
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="text-xs rounded-md bg-[var(--accent)] text-white px-3 py-1 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </header>

      {err && <p className="text-red-500 text-xs mb-2">{err}</p>}
      {msg && <p className="text-green-600 dark:text-green-400 text-xs mb-2">{msg}</p>}

      <ul className="space-y-3">
        {cats.map((c, i) => (
          <li key={i} className="rounded-md border border-[var(--border)] p-2 space-y-2">
            {/* top row */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => moveTop(i, -1)}
                  disabled={i === 0}
                  className="text-xs px-1 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveTop(i, 1)}
                  disabled={i === cats.length - 1}
                  className="text-xs px-1 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <input
                className={`${input} w-36`}
                placeholder="slug"
                value={c.slug}
                onChange={(e) => updateTop(i, { slug: e.target.value })}
              />
              <input
                className={`${input} flex-1`}
                placeholder="이름"
                value={c.name}
                onChange={(e) => updateTop(i, { name: e.target.value })}
              />
              <button
                onClick={() => addChild(i)}
                className="text-xs rounded-md border border-[var(--border)] px-2 py-1 whitespace-nowrap"
              >
                + 자식
              </button>
              <button
                onClick={() => removeTop(i)}
                className="text-xs rounded-md border border-red-500/50 text-red-500 px-2 py-1"
              >
                ×
              </button>
            </div>

            {/* children */}
            {c.children && c.children.length > 0 && (
              <ul className="ml-10 space-y-1.5 border-l border-[var(--border)] pl-3">
                {c.children.map((ch, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveChild(i, j, -1)}
                        disabled={j === 0}
                        className="text-xs px-1 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveChild(i, j, 1)}
                        disabled={j === (c.children?.length ?? 0) - 1}
                        className="text-xs px-1 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      className={`${input} w-32`}
                      placeholder="slug"
                      value={ch.slug}
                      onChange={(e) => updateChild(i, j, { slug: e.target.value })}
                    />
                    <input
                      className={`${input} flex-1`}
                      placeholder="이름"
                      value={ch.name}
                      onChange={(e) => updateChild(i, j, { name: e.target.value })}
                    />
                    <button
                      onClick={() => removeChild(i, j)}
                      className="text-xs rounded-md border border-red-500/50 text-red-500 px-2 py-1"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
